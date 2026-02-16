import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomContainer from "@/components/layout/custom-container";
import { useSchedules, useExportSchedules, useMenuIcon } from "@/hooks";
import { useActiveAccountTypes } from "@/hooks/api/central/use-account-types";
import {
  useActiveSchedules,
  useImportSchedules,
  useExportActiveScheduleTreeToPdf,
  useExportActiveScheduleTreeToExcel,
} from "@/hooks/api/central/use-schedules";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { useTableLayout, useListPreferences } from "@/hooks/common";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";
import { MultiSelect } from "@/components/ui/select/multi-select";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ListFilter,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Upload,
  Info,
  ChevronDown,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Schedule } from "@/types/central/schedule";

const ScheduleList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("schedules", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strScheduleCode",
        direction: "asc",
      },
    });

  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [editableFilter, setEditableFilter] = useState<boolean | undefined>(
    undefined
  );
  const [statusValue, setStatusValue] = useState<string>("all");
  const [editableValue, setEditableValue] = useState<string>("all");
  const [selectedParentSchedules, setSelectedParentSchedules] = useState<
    string[]
  >([]);
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>(
    []
  );
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [parentScheduleSearch, setParentScheduleSearch] = useState<
    string | undefined
  >(undefined);

  const defaultColumnOrder = [
    "actions",
    "strScheduleCode",
    "strScheduleName",
    "bolIsActive",
    "strRefNo",
    "strTemplateName",
    "strParentScheduleName",
    "strAccountTypeName",
    "bolIsEditable",
    "dblChartType",
  ];

  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const { data: parentSchedules, isLoading: isParentSchedulesLoading } =
    useActiveSchedules(parentScheduleSearch);
  const { data: accountTypes, isLoading: isAccountTypesLoading } =
    useActiveAccountTypes();

  const exportSchedules = useExportSchedules();
  const exportActiveScheduleTreeToPdf = useExportActiveScheduleTreeToPdf();
  const exportActiveScheduleTreeToExcel = useExportActiveScheduleTreeToExcel();

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
  } = useTableLayout("schedule", defaultColumnOrder, [], {
    actions: true,
    strScheduleCode: true,
    strScheduleName: true,
    strRefNo: true,
    strTemplateName: true,
    strParentScheduleName: true,
    dblChartType: true,
    strAccountTypeName: true,
    bolIsActive: true,
    bolIsEditable: true,
  });

  // Fetch schedules using the hook
  const { data: schedulesResponse, isLoading } = useSchedules({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy: sorting.columnKey || "strScheduleCode",
    ascending: sorting.direction === "asc",
    bolIsActive: activeFilter,
    bolIsEditable: editableFilter,
    ParentScheduleGUIDs:
      selectedParentSchedules.length > 0
        ? selectedParentSchedules.join(",")
        : undefined,
    DefaultAccountTypeGUIDs:
      selectedAccountTypes.length > 0
        ? selectedAccountTypes.join(",")
        : undefined,
  });

  useEffect(() => {
    if (schedulesResponse?.data) {
      updateResponseData({
        totalCount: schedulesResponse.data?.totalCount || 0,
        totalPages: schedulesResponse.data?.totalPages || 1,
      });
    }
  }, [schedulesResponse, updateResponseData]);

  const handleActiveFilterChange = (value: string) => {
    setStatusValue(value);
    if (value === "active") {
      setActiveFilter(true);
    } else if (value === "inactive") {
      setActiveFilter(false);
    } else {
      setActiveFilter(undefined);
    }
  };

  const handleEditableFilterChange = (value: string) => {
    setEditableValue(value);
    if (value === "editable") {
      setEditableFilter(true);
    } else if (value === "non-editable") {
      setEditableFilter(false);
    } else {
      setEditableFilter(undefined);
    }
  };

  const handleParentScheduleChange = (values: string[]) => {
    setSelectedParentSchedules(values);
    setPagination({
      ...pagination,
      pageNumber: 1,
    });
  };

  const handleAccountTypeChange = (values: string[]) => {
    setSelectedAccountTypes(values);
    setPagination({
      ...pagination,
      pageNumber: 1,
    });
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = React.useMemo(() => {
    const baseColumns: DataTableColumn<Schedule>[] = [];

    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (schedule) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              openEditInNewTab(`/schedule/${schedule.strScheduleGUID}`);
            }}
            title="Edit schedule"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      ),
    });

    baseColumns.push(
      {
        key: "strScheduleCode",
        header: "Code",
        width: "120px",
        cell: (schedule) => (
          <div className="truncate" title={schedule.strScheduleCode}>
            <span className="font-medium">{schedule.strScheduleCode}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strScheduleName",
        header: "Name",
        width: "200px",
        cell: (schedule) => (
          <div className="truncate" title={schedule.strScheduleName}>
            {schedule.strScheduleName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "100px",
        cell: (schedule) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              schedule.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {schedule.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
      },
      {
        key: "strRefNo",
        header: "Ref No",
        width: "120px",
        cell: (schedule) => (
          <div className="truncate" title={schedule.strRefNo || "-"}>
            {schedule.strRefNo || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTemplateName",
        header: "Template",
        width: "150px",
        cell: (schedule) => (
          <div className="truncate" title={schedule.strTemplateName || "-"}>
            {schedule.strTemplateName || "-"}
          </div>
        ),
        sortable: false,
      },
      {
        key: "strParentScheduleName",
        header: "Parent Schedule",
        width: "180px",
        cell: (schedule) => (
          <div
            className="truncate"
            title={schedule.strParentScheduleName || "-"}
          >
            {schedule.strParentScheduleName || "-"}
          </div>
        ),
        sortable: false,
      },
      {
        key: "strAccountTypeName",
        header: "Account Type",
        width: "150px",
        cell: (schedule) => (
          <div className="truncate" title={schedule.strAccountTypeName || "-"}>
            {schedule.strAccountTypeName || "-"}
          </div>
        ),
        sortable: false,
      },
      {
        key: "bolIsEditable",
        header: "Editable",
        width: "100px",
        cell: (schedule) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              schedule.bolIsEditable
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {schedule.bolIsEditable ? "Yes" : "No"}
          </span>
        ),
        sortable: false,
      },
      {
        key: "dblChartType",
        header: "Chart Type",
        width: "120px",
        cell: (schedule) => (
          <div
            className="truncate"
            title={schedule.dblChartType?.toString() || "-"}
          >
            {schedule.dblChartType || "-"}
          </div>
        ),
        sortable: false,
      }
    );

    return baseColumns;
  }, [openEditInNewTab]);

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

  const handleExport = (format: "excel" | "csv") => {
    exportSchedules.mutate({ format });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls")
      ) {
        setImportFile(selectedFile);
      } else {
        e.target.value = "";
        alert("Please select a valid Excel file (.xlsx or .xls)");
      }
    }
  };

  const importSchedules = useImportSchedules();

  const handleImport = async () => {
    if (!importFile) {
      return;
    }

    setIsImporting(true);

    await importSchedules.mutateAsync(importFile);
    setImportModalOpen(false);
    setImportFile(null);
    setIsImporting(false);
  };

  const handleSort = (column: string) => {
    if (sorting.columnKey === column) {
      setSorting({
        direction: sorting.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSorting({
        columnKey: column,
        direction: "asc",
      });
    }
  };

  const HeaderIcon = useMenuIcon("schedule_list", ListFilter);

  const orderedColumns = React.useMemo(() => {
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
        title="Schedules"
        description="View and manage all schedules in the system"
        icon={HeaderIcon}
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={
                    exportSchedules.isPending ||
                    exportActiveScheduleTreeToPdf.isPending ||
                    exportActiveScheduleTreeToExcel.isPending
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportSchedules.isPending ||
                  exportActiveScheduleTreeToPdf.isPending ||
                  exportActiveScheduleTreeToExcel.isPending
                    ? "Exporting..."
                    : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Schedules as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export Schedules as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportActiveScheduleTreeToPdf.mutate()}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export Tree as PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportActiveScheduleTreeToExcel.mutate()}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Tree as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>

            <Button onClick={() => navigate("/schedule/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <SearchInput
            placeholder="Search schedules by code, name, etc..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md sm:w-auto flex-1"
          />

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4 mr-1" />
            <span>Filters</span>
            {(selectedParentSchedules.length > 0 ||
              selectedAccountTypes.length > 0 ||
              activeFilter !== undefined ||
              editableFilter !== undefined) && (
              <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                {selectedParentSchedules.length +
                  selectedAccountTypes.length +
                  (activeFilter !== undefined ? 1 : 0) +
                  (editableFilter !== undefined ? 1 : 0)}
              </span>
            )}
          </Button>

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
                "schedule_column_order",
                JSON.stringify(order)
              );
            }}
            onResetAll={resetAll}
          />
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
                Filter schedules by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Parent Schedules
                  </label>
                  <MultiSelect
                    options={
                      parentSchedules?.map((schedule) => ({
                        value: schedule.strScheduleGUID,
                        label:
                          schedule.strScheduleInfo ||
                          `${schedule.strScheduleCode} - ${schedule.strScheduleName}`,
                      })) || []
                    }
                    selectedValues={selectedParentSchedules}
                    onChange={handleParentScheduleChange}
                    onInputChange={(value) => {
                      // Only trigger search if value is 3+ characters or empty
                      if (value.length >= 3 || value === "") {
                        setParentScheduleSearch(value);
                      }
                    }}
                    initialMessage="Type at least 3 characters to search"
                    placeholder="Type to search parent schedules..."
                    isLoading={isParentSchedulesLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Account Types
                  </label>
                  <MultiSelect
                    options={
                      accountTypes?.map((type) => ({
                        value: type.strAccountTypeGUID,
                        label: type.strName,
                      })) || []
                    }
                    selectedValues={selectedAccountTypes}
                    onChange={handleAccountTypeChange}
                    initialMessage="Select from available account types"
                    placeholder="Filter by account type"
                    isLoading={isAccountTypesLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={statusValue}
                    onValueChange={handleActiveFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Editable
                  </label>
                  <Select
                    value={editableValue}
                    onValueChange={handleEditableFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by editable status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="editable">Editable</SelectItem>
                      <SelectItem value="non-editable">Non-editable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedParentSchedules([]);
                    setSelectedAccountTypes([]);
                    setStatusValue("all");
                    setEditableValue("all");
                    setActiveFilter(undefined);
                    setEditableFilter(undefined);
                    setPagination({ pageNumber: 1 });
                  }}
                  disabled={
                    selectedParentSchedules.length === 0 &&
                    selectedAccountTypes.length === 0 &&
                    activeFilter === undefined &&
                    editableFilter === undefined
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* End of filters section */}

      {isLoading ? (
        <TableSkeleton
          columns={[
            "Actions",
            "Code",
            "Name",
            "Status",
            "Ref No",
            "Template",
            "Parent Schedule",
            "Account Type",
            "Editable",
            "Chart Type",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={schedulesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(schedule) => schedule.strScheduleGUID}
          columnVisibility={columnVisibility}
          pinnedColumns={pinnedColumns}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          sortBy={sorting.columnKey || ""}
          ascending={sorting.direction === "asc"}
          onSort={handleSort}
          loading={false}
          isTextWrapped={isTextWrapped}
          emptyState={
            debouncedSearch ? (
              <>No schedules found matching "{debouncedSearch}".</>
            ) : (
              <>No schedules found. Click "Add Schedule" to create one.</>
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
          maxHeight="calc(100vh - 350px)"
          pageSizeOptions={[5, 10, 20, 50]}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "schedule_column_widths",
              JSON.stringify(widths)
            );
          }}
        />
      )}

      {/* Import Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Schedules</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import schedules into the system.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-6 space-y-2">
              <Collapsible className="w-full">
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 rounded-md hover:bg-secondary">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-lg text-foreground">
                      Excel File Structure
                    </div>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-2">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="mb-3 text-sm text-foreground">
                      Your Excel file should have the following structure:
                    </p>

                    <div className="overflow-x-auto text-foreground">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-secondary">
                            <th className="border border-border p-2 text-left">
                              Column
                            </th>
                            <th className="border border-border p-2 text-left">
                              Header
                            </th>
                            <th className="border border-border p-2 text-left">
                              Description
                            </th>
                            <th className="border border-border p-2 text-left">
                              Example
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-border p-2 font-medium">
                              A
                            </td>
                            <td className="border border-border p-2">Code</td>
                            <td className="border border-border p-2">
                              Numeric identifier for the schedule
                            </td>
                            <td className="border border-border p-2">10001</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-2 font-medium">
                              B
                            </td>
                            <td className="border border-border p-2">
                              UDFCode
                            </td>
                            <td className="border border-border p-2">
                              Text code for the schedule
                            </td>
                            <td className="border border-border p-2">10001</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-2 font-medium">
                              C
                            </td>
                            <td className="border border-border p-2">RefNo</td>
                            <td className="border border-border p-2">
                              Reference number (optional)
                            </td>
                            <td className="border border-border p-2">1</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-2 font-medium">
                              D
                            </td>
                            <td className="border border-border p-2">Name</td>
                            <td className="border border-border p-2">
                              Name of the schedule
                            </td>
                            <td className="border border-border p-2">ASSETS</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-2 font-medium">
                              E
                            </td>
                            <td className="border border-border p-2">
                              TemplateCode
                            </td>
                            <td className="border border-border p-2">
                              Template code for the schedule
                            </td>
                            <td className="border border-border p-2">Accuri</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-2 font-medium">
                              F
                            </td>
                            <td className="border border-border p-2">
                              UnderCode
                            </td>
                            <td className="border border-border p-2">
                              Code of parent schedule (0 for top level)
                            </td>
                            <td className="border border-border p-2">0</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-2 font-medium">
                              G
                            </td>
                            <td className="border border-border p-2">
                              ChartType
                            </td>
                            <td className="border border-border p-2">
                              Chart type number
                            </td>
                            <td className="border border-border p-2">1</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-2 font-medium">
                              H
                            </td>
                            <td className="border border-border p-2">
                              DefaultAccountTypeCode
                            </td>
                            <td className="border border-border p-2">
                              Default account type code
                            </td>
                            <td className="border border-border p-2">ASSET</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-2 font-medium">
                              I
                            </td>
                            <td className="border border-border p-2">
                              IsActive
                            </td>
                            <td className="border border-border p-2">
                              1 for active, 0 for inactive
                            </td>
                            <td className="border border-border p-2">1</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-2 font-medium">
                              J
                            </td>
                            <td className="border border-border p-2">
                              Editable
                            </td>
                            <td className="border border-border p-2">
                              1 for editable, 0 for non-editable
                            </td>
                            <td className="border border-border p-2">1</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      <div className="flex items-start gap-1 mb-1">
                        <Info className="h-3 w-3 mt-0.5 text-amber-500" />
                        <span>
                          <strong>Required fields:</strong> Code (A), UDFCode
                          (B), and Name (D). First row should contain headers
                          exactly as shown above.
                        </span>
                      </div>
                      <div className="flex items-start gap-1">
                        <Info className="h-3 w-3 mt-0.5 text-blue-500" />
                        <span>
                          <strong>IsActive/Editable columns:</strong> Use values
                          1 for Yes/True and 0 for No/False.
                        </span>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="grid w-full max-w-sm items-center text-foreground gap-1.5">
              <label htmlFor="schedule-import" className="text-sm font-medium">
                Select Excel File
              </label>
              <Input
                id="schedule-import"
                type="file"
                className="cursor-pointer"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
              />
              {importFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  File: {importFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="sm:justify-right">
            <Button
              variant="outline"
              onClick={() => {
                setImportModalOpen(false);
                setImportFile(null);
              }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || isImporting}
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomContainer>
  );
};

export default ScheduleList;
