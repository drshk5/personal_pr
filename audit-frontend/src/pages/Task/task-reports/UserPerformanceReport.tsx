import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  Timer,
  ListChecks,
  FileSpreadsheet,
  Play,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useBoardsByUser } from "@/hooks/api/task/use-board-team";
import { useBoardSectionsByBoardGuid } from "@/hooks/api/task/use-board-sections";
import { useBoardSubModulesBySection } from "@/hooks/api/task/use-board-sub-module";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import {
  useUserPerformanceReport,
  useExportUserPerformanceReportPdf,
  useExportUserPerformanceReportExcel,
  useExportUserPerformanceReportCsv,
  usePreviewUserPerformanceReportPdf,
} from "@/hooks/api/task/use-task-reports";
import { useTableLayout, useListPreferences } from "@/hooks/common";
import type { UserPerformanceReportItem } from "@/types/task/task-reports";

import CustomContainer from "@/components/layout/custom-container";
import { Card } from "@/components/ui/card";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModalDialog } from "@/components/ui/modal-dialog";

function buildBoardOptions(
  boards?: { strBoardGUID: string; strBoardName?: string | null }[]
) {
  if (!boards) return [];
  return boards.map((board) => ({
    value: board.strBoardGUID,
    label: board.strBoardName || "Untitled Board",
  }));
}

const UserPerformanceReport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const toIsoLocal = (date: Date) => {
    const tzOffset = date.getTimezoneOffset();
    const adjusted = new Date(date.getTime() - tzOffset * 60000);
    return adjusted.toISOString().split("T")[0];
  };

  const [selectedBoard, setSelectedBoard] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedSubModule, setSelectedSubModule] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userSelected, setUserSelected] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>(toIsoLocal(startOfMonth));
  const [toDate, setToDate] = useState<string>(toIsoLocal(endOfMonth));
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [displayClicked, setDisplayClicked] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [subModuleDropdownOpen, setSubModuleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const defaultColumnOrder = [
    "strUserName",
    "strBoardSectionName",
    "strBoardSubModuleName",
    "strTaskTitle",
    "bolIsBillable",
    "strTicketKey",
    "intTotalTimerCount",
    "strTotalHours",
  ];

  console.log("[UserPerformanceReport] render");
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("userPerformanceReport", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "",
        direction: "asc",
      },
    });

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
    resetAll,
    columnOrder,
    setColumnOrder,
    columnWidths,
    setColumnWidths,
  } = useTableLayout("userPerformanceReport", defaultColumnOrder, [], {
    strUserName: true,
    strTaskTitle: true,
    strBoardName: true,
    strBoardSectionName: true,
    strBoardSubModuleName: true,
    bolIsBillable: true,
    strTicketKey: true,
    intTotalTimerCount: true,
    intTotalMinutes: true,
    strTotalHours: true,
  });

  const boardsQuery = useBoardsByUser(user?.strUserGUID, boardDropdownOpen);
  const moduleUsersQuery = useModuleUsers(
    undefined,
    undefined,
    userDropdownOpen
  );
  const sectionsQuery = useBoardSectionsByBoardGuid(
    selectedBoard,
    {},
    sectionDropdownOpen && !!selectedBoard
  );
  const subModulesQuery = useBoardSubModulesBySection(
    selectedSection,
    {},
    subModuleDropdownOpen && !!selectedSection
  );

  const exportPdfMutation = useExportUserPerformanceReportPdf();
  const exportExcelMutation = useExportUserPerformanceReportExcel();
  const exportCsvMutation = useExportUserPerformanceReportCsv();
  const previewPdfMutation = usePreviewUserPerformanceReportPdf();

  const params = useMemo(
    () =>
      displayClicked && (selectedBoard || userSelected)
        ? {
            strBoardGUID: selectedBoard || undefined,
            strBoardSectionGUID: selectedSection || undefined,
            strBoardSubModuleGUID: selectedSubModule || undefined,
            strUserGUID:
              selectedUser && selectedUser !== "__ALL__"
                ? selectedUser
                : undefined,
            dtFromDate: fromDate || undefined,
            dtToDate: toDate || undefined,
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            search: debouncedSearch || undefined,
            sortBy: sorting.columnKey || undefined,
            ascending: sorting.direction === "asc",
          }
        : undefined,
    [
      displayClicked,
      selectedBoard,
      userSelected,
      selectedSection,
      selectedSubModule,
      selectedUser,
      fromDate,
      toDate,
      pagination.pageNumber,
      pagination.pageSize,
      debouncedSearch,
      sorting.columnKey,
      sorting.direction,
    ]
  );

  const { data, isLoading, refetch } = useUserPerformanceReport(
    params,
    displayClicked && (!!selectedBoard || userSelected)
  );

  useEffect(() => {
    if (data) {
      updateResponseData({
        totalCount: data.totalRecords || data.totalRecords,
        totalPages: data.totalPages,
      });
    }
  }, [data, updateResponseData]);

  const boardOptions = buildBoardOptions(boardsQuery.data?.boards);
  const sectionOptions = useMemo(() => {
    const sections = sectionsQuery.data?.data || [];
    return sections.map(
      (s: { strBoardSectionGUID: string; strName?: string | null }) => ({
        value: s.strBoardSectionGUID,
        label: s.strName || "Untitled Section",
      })
    );
  }, [sectionsQuery.data]);

  const subModuleOptions = useMemo(() => {
    const subModules = subModulesQuery.data?.data || [];
    return subModules.map(
      (sm: { strBoardSubModuleGUID: string; strName?: string | null }) => ({
        value: sm.strBoardSubModuleGUID,
        label: sm.strName || "Untitled Sub Module",
      })
    );
  }, [subModulesQuery.data]);

  const assignableUsers = useMemo(() => {
    const users = moduleUsersQuery.data || [];
    return users.map(
      (u: {
        strUserGUID: string;
        strName?: string | null;
        strProfileImg?: string | null;
      }) => ({
        strUserGUID: u.strUserGUID,
        strName: u.strName || "Unknown",
        strProfileImg: u.strProfileImg || undefined,
      })
    );
  }, [moduleUsersQuery.data]);

  const userOptions = useMemo(
    () => [
      { value: "__ALL__", label: "All users" },
      ...assignableUsers.map((u) => ({
        value: u.strUserGUID,
        label: u.strName,
      })),
    ],
    [assignableUsers]
  );

  const buildExportParams = () => ({
    strBoardGUID: selectedBoard || undefined,
    strBoardSectionGUID: selectedSection || undefined,
    strBoardSubModuleGUID: selectedSubModule || undefined,
    strUserGUID:
      selectedUser && selectedUser !== "__ALL__" ? selectedUser : undefined,
    dtFromDate: fromDate || undefined,
    dtToDate: toDate || undefined,
  });

  const handleExportPdf = async () => {
    exportPdfMutation.mutate(buildExportParams(), {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `user-performance-${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    });
  };

  const handleExportExcel = async () => {
    exportExcelMutation.mutate(buildExportParams(), {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `user-performance-${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    });
  };

  const handleExportCsv = async () => {
    exportCsvMutation.mutate(buildExportParams(), {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `user-performance-${new Date().getTime()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    });
  };

  const handlePreviewPdf = async () => {
    try {
      const blob = await previewPdfMutation.mutateAsync(buildExportParams());
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setIsPreviewModalOpen(true);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const handleSort = useCallback(
    (column: string) => {
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
      setPagination({ pageNumber: 1 });
    },
    [sorting.columnKey, sorting.direction, setSorting, setPagination]
  );

  const goToPage = useCallback(
    (pageNumber: number) => {
      setPagination({ pageNumber });
    },
    [setPagination]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPagination({
        pageSize: newSize,
        pageNumber: 1,
      });
    },
    [setPagination]
  );

  // Note: Unlike other pages, rely on SearchInput's debounce and only update search state.
  // Do not reset page here; keeps behavior consistent with PurchaseInvoiceList.
  // If you want to reset page on search, do it in a separate effect watching debouncedSearch.

  const columns = useMemo(() => {
    const getTextClass = () => (isTextWrapped ? "text-wrap" : "truncate");

    const baseColumns: DataTableColumn<UserPerformanceReportItem>[] = [
      {
        key: "strUserName",
        header: "User Name",
        width: "200px",
        cell: (row) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strUserName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTaskTitle",
        header: "Task",
        width: "260px",
        cell: (row) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strTaskTitle}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strBoardSectionName",
        header: "Module",
        width: "180px",
        cell: (row) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strBoardSectionName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strBoardSubModuleName",
        header: "Sub Module",
        width: "180px",
        cell: (row) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strBoardSubModuleName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsBillable",
        header: "Billable",
        width: "100px",
        align: "center",
        cell: (row) => (
          <div className="flex justify-center">
            {row.bolIsBillable ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Yes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                No
              </span>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTicketKey",
        header: "Ticket",
        width: "180px",
        cell: (row) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strTicketKey ? (
              <div className="flex flex-wrap items-center gap-2">
                {row.strTicketSource && (
                  <span className="text-sm text-foreground">
                    {row.strTicketSource}:
                  </span>
                )}
                {row.strTicketUrl ? (
                  <a
                    href={row.strTicketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    {row.strTicketKey}
                  </a>
                ) : (
                  <span>{row.strTicketKey}</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        key: "intTotalTimerCount",
        header: "Timers",
        width: "90px",
        align: "center",
        cell: (row) => (
          <div className="flex justify-center">
            <span>{row.intTotalTimerCount}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTotalHours",
        header: "Total Hours",
        width: "150px",
        cell: (row) => (
          <div className="flex">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
              <Timer className="h-3.5 w-3.5 text-amber-500" />
              {row.strTotalHours}
            </span>
          </div>
        ),
        sortable: true,
      },
    ];

    return baseColumns;
  }, [isTextWrapped]);

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((col) => [col.key, col]));
    return columnOrder
      .map((key) => columnMap.get(key))
      .filter(
        (col): col is DataTableColumn<UserPerformanceReportItem> =>
          col !== undefined
      );
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <div className="flex flex-col gap-4 space-y-1 mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                User Performance
              </h1>
              <p className="text-sm text-muted-foreground">
                Task activity, timers, and billable flags per user
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/reports")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:flex-wrap">
          <SearchInput
            placeholder="Search tasks..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md lg:flex-1"
          />

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
              onResetAll={() => {
                resetAll();
              }}
              onColumnOrderChange={(order) => {
                setColumnOrder(order);
                localStorage.setItem(
                  "userPerformanceReport_column_order",
                  JSON.stringify(order)
                );
              }}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewPdf}
            className="gap-2"
            disabled={
              !fromDate || !toDate || previewPdfMutation.isPending || isLoading
            }
          >
            <FileText className="h-4 w-4" />
            Preview PDF
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={
                  !fromDate ||
                  !toDate ||
                  exportPdfMutation.isPending ||
                  exportExcelMutation.isPending ||
                  exportCsvMutation.isPending
                }
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleExportPdf}
                disabled={exportPdfMutation.isPending}
              >
                <FileText className="mr-2 h-4 w-4" />
                {exportPdfMutation.isPending
                  ? "Exporting PDF..."
                  : "Export as PDF"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportExcel}
                disabled={exportExcelMutation.isPending}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {exportExcelMutation.isPending
                  ? "Exporting Excel..."
                  : "Export as Excel"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportCsv}
                disabled={exportCsvMutation.isPending}
              >
                <FileText className="mr-2 h-4 w-4" />
                {exportCsvMutation.isPending
                  ? "Exporting CSV..."
                  : "Export as CSV"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:flex-nowrap">
          <div className="w-full sm:w-full md:w-52 lg:w-48">
            <PreloadedSelect
              options={boardOptions}
              selectedValue={selectedBoard}
              onChange={(value) => {
                setSelectedBoard(value);
                setSelectedSection("");
                setSelectedUser("");
                setUserSelected(false);
                setDisplayClicked(false);
                setPagination({ pageNumber: 1 });
              }}
              placeholder={
                boardsQuery.isLoading ? "Loading projects..." : "Select project"
              }
              isLoading={boardsQuery.isLoading}
              onOpenChange={setBoardDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-full md:w-52 lg:w-48">
            <PreloadedSelect
              options={sectionOptions}
              selectedValue={selectedSection}
              onChange={(value) => {
                setSelectedSection(value);
                setSelectedSubModule("");
                setDisplayClicked(false);
                setPagination({ pageNumber: 1 });
              }}
              placeholder={
                selectedBoard ? "All modules" : "Select a project first"
              }
              isLoading={sectionsQuery.isLoading}
              disabled={!selectedBoard || sectionsQuery.isLoading}
              allowNone
              noneLabel="All sections"
              onOpenChange={setSectionDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-full md:w-52 lg:w-48">
            <PreloadedSelect
              options={subModuleOptions}
              selectedValue={selectedSubModule}
              onChange={(value) => {
                setSelectedSubModule(value);
                setDisplayClicked(false);
                setPagination({ pageNumber: 1 });
              }}
              placeholder={
                selectedSection ? "All sub modules" : "Select a module first"
              }
              isLoading={subModulesQuery.isLoading}
              disabled={!selectedSection || subModulesQuery.isLoading}
              allowNone
              noneLabel="All sub modules"
              onOpenChange={setSubModuleDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-full md:w-52 lg:w-48">
            <PreloadedSelect
              options={userOptions}
              selectedValue={selectedUser}
              onChange={(val) => {
                setSelectedUser(val);
                setUserSelected(true);
                setDisplayClicked(false);
                setPagination({ pageNumber: 1 });
              }}
              placeholder="Select users"
              isLoading={moduleUsersQuery.isLoading}
              disabled={moduleUsersQuery.isLoading}
              allowNone={false}
              noneLabel="All users"
              onOpenChange={setUserDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-auto lg:w-auto">
            <DateRangePicker
              startDate={fromDate ? new Date(fromDate) : undefined}
              endDate={toDate ? new Date(toDate) : undefined}
              onRangeChange={(start, end) => {
                if (!start) {
                  setFromDate("");
                  setToDate("");
                  setPagination({ pageNumber: 1 });
                  return;
                }

                const startISO = toIsoLocal(start);
                const endISO = toIsoLocal(end || start);

                setFromDate(startISO);
                setToDate(endISO);
                setPagination({ pageNumber: 1 });
              }}
              placeholder="Select date range"
            />
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (!fromDate || !toDate) {
                return;
              }
              if (!selectedBoard && !userSelected) {
                toast.info(
                  "Please select a project or user to display the report"
                );
                return;
              }
              setDisplayClicked(true);
              if (displayClicked && pagination.pageNumber === 1) {
                refetch();
              }
              setPagination({ pageNumber: 1 });
            }}
            disabled={!fromDate || !toDate || isLoading}
            className="gap-2"
          >
            Display
            <Play className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsResetting(true);
              setTimeout(() => {
                setSelectedBoard("");
                setSelectedSection("");
                setSelectedUser("");
                setUserSelected(false);
                setDisplayClicked(false);
                setPagination({ pageNumber: 1 });
                setIsResetting(false);
              }, 600);
            }}
            disabled={isResetting}
            className="gap-2"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {!displayClicked ? (
          <Card className="p-8 text-center flex flex-col items-center gap-3 bg-muted/30 border-dashed">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ListChecks className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold text-foreground">
              No Project or User Selected
            </div>
            <p className="text-sm text-muted-foreground">
              Select a project or user and a date range, then click the Display
              button to view the performance report.
            </p>
          </Card>
        ) : isLoading ? (
          <TableSkeleton
            columns={[
              "User Name",
              "Task Title",
              "Project",
              "Module",
              "Billable",
              "Ticket",
              "Timers",
              "Total Hours",
            ]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <DataTable
            data={data?.data || []}
            columns={orderedColumns}
            keyExtractor={(row: UserPerformanceReportItem) =>
              `${row.strTaskGUID}`
            }
            sortBy={sorting.columnKey || ""}
            ascending={sorting.direction === "asc"}
            onSort={handleSort}
            loading={isLoading}
            columnVisibility={columnVisibility}
            alwaysVisibleColumns={getAlwaysVisibleColumns()}
            isTextWrapped={isTextWrapped}
            pinnedColumns={pinnedColumns}
            columnWidths={columnWidths}
            onColumnWidthsChange={setColumnWidths}
            emptyState={
              debouncedSearch ? (
                <>No tasks found matching "{debouncedSearch}".</>
              ) : (
                <>No data found for the selected filters.</>
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
            maxHeight="calc(93vh - 350px)"
            pageSizeOptions={[10, 20, 50, 100]}
          />
        )}
      </div>

      <ModalDialog
        open={isPreviewModalOpen}
        onOpenChange={handleClosePreviewModal}
        title="User Performance Preview"
        maxWidth="1200px"
        fullHeight={true}
        showCloseButton={true}
      >
        {previewPdfUrl && (
          <iframe
            src={previewPdfUrl}
            className="w-full h-full min-h-150"
            title="User Performance PDF Preview"
          />
        )}
      </ModalDialog>
    </CustomContainer>
  );
};

export default UserPerformanceReport;
