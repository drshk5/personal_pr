import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  ListChecks,
  Play,
  RefreshCcw,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useBoardsByUser } from "@/hooks/api/task/use-board-team";
import { useBoardSectionsByBoardGuid } from "@/hooks/api/task/use-board-sections";
import { useBoardSubModulesBySection } from "@/hooks/api/task/use-board-sub-module";
import {
  useBoardwiseSummaryReport,
  useExportBoardwiseSummaryExcel,
  useExportBoardwiseSummaryPdf,
  usePreviewBoardwiseSummaryPdf,
} from "@/hooks/api/task/use-task-reports";
import { useTableLayout } from "@/hooks/common";
import type { BoardwiseTaskSummary } from "@/types/task/task-reports";

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

const ProjectSummaryReport: React.FC = () => {
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
  const [fromDate, setFromDate] = useState<string>(toIsoLocal(startOfMonth));
  const [toDate, setToDate] = useState<string>(toIsoLocal(endOfMonth));
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [displayClicked, setDisplayClicked] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [subModuleDropdownOpen, setSubModuleDropdownOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const [sorting, setSorting] = useState({
    columnKey: "",
    direction: "asc" as "asc" | "desc",
  });

  const defaultColumnOrder = [
    "intTaskNo",
    "strBoardSectionName",
    "strBoardSubModuleName",
    "strTaskName",
    "ticket",
    "dblBillableHours",
    "dblNonBillableHours",
  ];

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
  } = useTableLayout("projectSummaryReport", defaultColumnOrder, [], {
    intTaskNo: true,
    strTaskName: true,
    strBoardSectionName: true,
    strBoardSubModuleName: true,
    ticket: true,
    dblBillableHours: true,
    dblNonBillableHours: true,
  });

  const boardsQuery = useBoardsByUser(user?.strUserGUID, boardDropdownOpen);
  const sectionsQuery = useBoardSectionsByBoardGuid(
    selectedBoard,
    {},
    sectionDropdownOpen && !!selectedBoard
  );
  const subModulesQuery = useBoardSubModulesBySection(
    selectedSection,
    { strBoardGUID: selectedBoard },
    subModuleDropdownOpen && !!selectedSection
  );

  const exportPdfMutation = useExportBoardwiseSummaryPdf();
  const exportExcelMutation = useExportBoardwiseSummaryExcel();
  const previewPdfMutation = usePreviewBoardwiseSummaryPdf();

  const params = useMemo(
    () =>
      displayClicked && selectedBoard
        ? {
            strBoardGUID: selectedBoard,
            strBoardSectionGUID: selectedSection || undefined,
            strBoardSubModuleGUID: selectedSubModule || undefined,
            dtFromDate: fromDate || undefined,
            dtToDate: toDate || undefined,
          }
        : undefined,
    [
      displayClicked,
      selectedBoard,
      selectedSection,
      selectedSubModule,
      fromDate,
      toDate,
    ]
  );

  const { data, isLoading, refetch } = useBoardwiseSummaryReport(
    params,
    displayClicked && !!params
  );

  const tasks = useMemo(() => data?.data?.tasks || [], [data?.data?.tasks]);

  const filteredTasks = useMemo(() => {
    if (!debouncedSearch) return tasks;
    const searchLower = debouncedSearch.toLowerCase();
    return tasks.filter(
      (task) =>
        task.strTaskName.toLowerCase().includes(searchLower) ||
        String(task.intTaskNo).includes(searchLower) ||
        task.strBoardSectionName?.toLowerCase().includes(searchLower) ||
        task.strBoardSubModuleName?.toLowerCase().includes(searchLower) ||
        task.strTicketKey?.toLowerCase().includes(searchLower) ||
        task.strTicketSource?.toLowerCase().includes(searchLower)
    );
  }, [debouncedSearch, tasks]);

  const sortedTasks = useMemo(() => {
    if (!sorting.columnKey) return filteredTasks;

    const getSortValue = (item: BoardwiseTaskSummary) => {
      switch (sorting.columnKey) {
        case "intTaskNo":
          return item.intTaskNo;
        case "strTaskName":
          return item.strTaskName?.toLowerCase() || "";
        case "dblBillableHours":
          return item.dblBillableHours ?? 0;
        case "dblNonBillableHours":
          return item.dblNonBillableHours ?? 0;
        default:
          return "";
      }
    };

    const sorted = [...filteredTasks].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      if (typeof aValue === "number" && typeof bValue === "number") {
        return aValue - bValue;
      }
      return String(aValue).localeCompare(String(bValue));
    });

    return sorting.direction === "asc" ? sorted : sorted.reverse();
  }, [filteredTasks, sorting]);

  const boardOptions = buildBoardOptions(boardsQuery.data?.boards);
  const sectionOptions = useMemo(() => {
    if (!sectionsQuery.data?.data?.length) return [];
    return sectionsQuery.data.data.map((section) => ({
      value: section.strBoardSectionGUID,
      label: section.strName || "Untitled Module",
    }));
  }, [sectionsQuery.data?.data]);

  const subModuleOptions = useMemo(() => {
    if (!subModulesQuery.data?.data?.length) return [];
    return subModulesQuery.data.data.map((subModule) => ({
      value: subModule.strBoardSubModuleGUID,
      label: subModule.strName || "Untitled Sub Module",
    }));
  }, [subModulesQuery.data?.data]);

  const buildExportParams = () => ({
    strBoardGUID: selectedBoard,
    strBoardSectionGUID: selectedSection || undefined,
    strBoardSubModuleGUID: selectedSubModule || undefined,
    dtFromDate: fromDate || undefined,
    dtToDate: toDate || undefined,
  });

  const handleExportPdf = async () => {
    exportPdfMutation.mutate(buildExportParams(), {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `project-summary-${new Date().getTime()}.pdf`;
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
        link.download = `project-summary-${new Date().getTime()}.xlsx`;
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

  const columns = useMemo(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "truncate";
    };

    const baseColumns: DataTableColumn<BoardwiseTaskSummary>[] = [
      {
        key: "intTaskNo",
        header: "Task No",
        width: "100px",
        align: "center",
        cell: (row: BoardwiseTaskSummary) => (
          <div className="text-foreground text-center font-medium">
            {row.intTaskNo}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTaskName",
        header: "Task Name",
        width: "300px",
        cell: (row: BoardwiseTaskSummary) => (
          <div className={`text-foreground  ${getTextClass()}`}>
            {row.strTaskName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strBoardSectionName",
        header: "Module",
        width: "200px",
        cell: (row: BoardwiseTaskSummary) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strBoardSectionName || "—"}
          </div>
        ),
        sortable: false,
      },
      {
        key: "strBoardSubModuleName",
        header: "Sub Module",
        width: "200px",
        cell: (row: BoardwiseTaskSummary) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strBoardSubModuleName || "—"}
          </div>
        ),
        sortable: false,
      },
      {
        key: "ticket",
        header: "Ticket",
        width: "180px",
        cell: (row: BoardwiseTaskSummary) => (
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
        sortable: false,
      },
      {
        key: "dblBillableHours",
        header: "Billable Hours",
        width: "145px",
        align: "center",
        cell: (row: BoardwiseTaskSummary) => (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
              <Timer className="h-3.5 w-3.5 text-emerald-500" />
              {row.strBillableHours}
            </span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "dblNonBillableHours",
        header: "Non-Billable",
        width: "150px",
        align: "center",
        cell: (row: BoardwiseTaskSummary) => (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
              <Timer className="h-3.5 w-3.5 text-amber-500" />
              {row.strNonBillableHours}
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
        (col): col is DataTableColumn<BoardwiseTaskSummary> => col !== undefined
      );
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col space-y-1 mt-6 gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Project Summary
              </h1>
              <p className="text-sm text-muted-foreground">
                Billable and non-billable hours by task for a project
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
            placeholder="Search by task number or name..."
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
                  "projectSummaryReport_column_order",
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
              !selectedBoard || previewPdfMutation.isPending || isLoading
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
                  !selectedBoard ||
                  exportPdfMutation.isPending ||
                  exportExcelMutation.isPending
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
                <FileText className="mr-2 h-4 w-4" />
                {exportExcelMutation.isPending
                  ? "Exporting Excel..."
                  : "Export as Excel"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:flex-wrap">
          <div className="w-full sm:w-full md:w-52 lg:w-52">
            <PreloadedSelect
              options={boardOptions}
              selectedValue={selectedBoard}
              onChange={(value) => {
                setSelectedBoard(value);
                setSelectedSection("");
                setSelectedSubModule("");
                setDisplayClicked(false);
              }}
              placeholder={
                boardsQuery.isLoading ? "Loading projects..." : "Select project"
              }
              isLoading={boardsQuery.isLoading}
              onOpenChange={setBoardDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-full md:w-52 lg:w-52">
            <PreloadedSelect
              options={sectionOptions}
              selectedValue={selectedSection}
              onChange={(value) => {
                setSelectedSection(value);
                setSelectedSubModule("");
                setDisplayClicked(false);
              }}
              placeholder={
                !selectedBoard
                  ? "Select project first"
                  : sectionsQuery.isLoading
                    ? "Loading modules..."
                    : "Select module"
              }
              isLoading={sectionsQuery.isLoading}
              disabled={!selectedBoard}
              clearable={true}
              onOpenChange={setSectionDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-full md:w-52 lg:w-52">
            <PreloadedSelect
              options={subModuleOptions}
              selectedValue={selectedSubModule}
              onChange={(value) => {
                setSelectedSubModule(value);
                setDisplayClicked(false);
              }}
              placeholder={
                !selectedSection
                  ? "Select module first"
                  : subModulesQuery.isLoading
                    ? "Loading sub modules..."
                    : "Select sub module"
              }
              isLoading={subModulesQuery.isLoading}
              disabled={!selectedSection}
              clearable={true}
              onOpenChange={setSubModuleDropdownOpen}
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
                  setDisplayClicked(false);
                  return;
                }

                const startISO = toIsoLocal(start);
                const endISO = toIsoLocal(end || start);

                setFromDate(startISO);
                setToDate(endISO);
                setDisplayClicked(false);
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
              if (!selectedBoard) {
                toast.info("Please select a project first");
                return;
              }
              setDisplayClicked(true);
              if (displayClicked) {
                refetch();
              }
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
                setSelectedSubModule("");
                setFromDate(toIsoLocal(startOfMonth));
                setToDate(toIsoLocal(endOfMonth));
                setDisplayClicked(false);
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
              Click Display to Load Report
            </div>
            <p className="text-sm text-muted-foreground">
              Select a project and date range, then click the Display button to
              view the summary report.
            </p>
          </Card>
        ) : isLoading ? (
          <TableSkeleton
            columns={[
              "Task No",
              "Task Name",
              "Module",
              "Sub Module",
              "Ticket",
              "Billable Hours",
              "Non-Billable",
            ]}
            pageSize={10}
          />
        ) : (
          <div className="space-y-6">
            {data?.data?.total && (
              <Card className="p-3 border-2 shadow-sm">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground mb-2">
                      Project Name
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {data?.data?.strBoardName || "Selected Project"}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 flex-1 justify-end">
                    <div className="flex items-center gap-3 px-1 py-1 bg-emerald-50 border-2 border-emerald-200 rounded-lg ">
                      <Timer className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                          Total Billable
                        </span>
                        <span className="text-base font-bold text-emerald-900 mt-0.5">
                          {data?.data?.total?.strTotalBillableHours ||
                            "00:00:00"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-2 py-1 bg-amber-50 border-2 border-amber-200 rounded-lg ">
                      <Timer className="h-5 w-5 text-amber-600 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                          Total Non-Billable
                        </span>
                        <span className="text-base font-bold text-amber-900 mt-0.5">
                          {data?.data?.total?.strTotalNonBillableHours ||
                            "00:00:00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <DataTable
              data={sortedTasks}
              columns={orderedColumns}
              keyExtractor={(row: BoardwiseTaskSummary) => row.strTaskGUID}
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
                  <>No summary data found for the selected filters.</>
                )
              }
              maxHeight="calc(93vh - 350px)"
            />
          </div>
        )}
      </div>

      <ModalDialog
        open={isPreviewModalOpen}
        onOpenChange={handleClosePreviewModal}
        title="Project Summary Preview"
        maxWidth="1200px"
        fullHeight={true}
        showCloseButton={true}
      >
        {previewPdfUrl && (
          <iframe
            src={previewPdfUrl}
            className="w-full h-full min-h-150"
            title="Project Summary PDF Preview"
          />
        )}
      </ModalDialog>
    </CustomContainer>
  );
};

export default ProjectSummaryReport;
