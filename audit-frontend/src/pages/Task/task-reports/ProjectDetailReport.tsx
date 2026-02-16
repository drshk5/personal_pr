import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  ListChecks,
  Play,
  RefreshCcw,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthContext } from "@/hooks/common/use-auth-context";
import {
  useBoardsByUser,
  useUserHierarchy,
} from "@/hooks/api/task/use-board-team";
import {
  useBoardwiseDetailsReport,
  useExportBoardwiseDetailsExcel,
  useExportBoardwiseDetailsPdf,
  usePreviewBoardwiseDetailsPdf,
} from "@/hooks/api/task/use-task-reports";
import { useTableLayout } from "@/hooks/common";
import type { BoardwiseDetailRecord } from "@/types/task/task-reports";
import type { Subordinate } from "@/types/task/board-team";

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

const ProjectDetailReport: React.FC = () => {
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
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(toIsoLocal(startOfMonth));
  const [toDate, setToDate] = useState<string>(toIsoLocal(endOfMonth));
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [displayClicked, setDisplayClicked] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const [sorting, setSorting] = useState({
    columnKey: "",
    direction: "asc" as "asc" | "desc",
  });

  const defaultColumnOrder = [
    "strUserName",
    "intTaskNo",
    "strBoardSectionName",
    "strBoardSubModuleName",
    "strTaskName",
    "strTicketKey",
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
  } = useTableLayout("projectDetailReport", defaultColumnOrder, [], {
    strUserName: true,
    intTaskNo: true,
    strTaskName: true,
    strBoardSectionName: true,
    strBoardSubModuleName: true,
    strTicketKey: true,
    dblBillableHours: true,
    dblNonBillableHours: true,
  });

  const boardsQuery = useBoardsByUser(user?.strUserGUID, boardDropdownOpen);
  const hierarchyQuery = useUserHierarchy(
    user?.strUserGUID,
    selectedBoard,
    userDropdownOpen && !!selectedBoard
  );

  const exportPdfMutation = useExportBoardwiseDetailsPdf();
  const exportExcelMutation = useExportBoardwiseDetailsExcel();
  const previewPdfMutation = usePreviewBoardwiseDetailsPdf();

  const params = useMemo(
    () =>
      displayClicked && selectedBoard
        ? {
            strBoardGUID: selectedBoard,
            dtFromDate: fromDate || undefined,
            dtToDate: toDate || undefined,
            strUserGUIDs: selectedUser || undefined,
          }
        : undefined,
    [displayClicked, selectedBoard, selectedUser, fromDate, toDate]
  );

  const { data, isLoading, refetch } = useBoardwiseDetailsReport(
    params,
    displayClicked && !!params
  );

  const details = useMemo(() => data?.data?.items || [], [data?.data?.items]);
  const userTotals = useMemo(
    () => data?.data?.userTotals || [],
    [data?.data?.userTotals]
  );

  const filteredDetails = useMemo(() => {
    if (!debouncedSearch) return details;
    const searchLower = debouncedSearch.toLowerCase();
    return details.filter(
      (item) =>
        item.strUserName.toLowerCase().includes(searchLower) ||
        item.strTaskName.toLowerCase().includes(searchLower) ||
        String(item.intTaskNo).includes(searchLower)
    );
  }, [debouncedSearch, details]);

  const sortedDetails = useMemo(() => {
    if (!sorting.columnKey) return filteredDetails;

    const getSortValue = (item: BoardwiseDetailRecord) => {
      switch (sorting.columnKey) {
        case "strUserName":
          return item.strUserName?.toLowerCase() || "";
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

    const sorted = [...filteredDetails].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      if (typeof aValue === "number" && typeof bValue === "number") {
        return aValue - bValue;
      }
      return String(aValue).localeCompare(String(bValue));
    });

    return sorting.direction === "asc" ? sorted : sorted.reverse();
  }, [filteredDetails, sorting]);

  const boardOptions = buildBoardOptions(boardsQuery.data?.boards);
  const assignableUsers = useMemo(() => {
    const hierarchy = hierarchyQuery.data;
    const baseUsers = hierarchy?.strUserGUID
      ? [
          {
            strUserGUID: hierarchy.strUserGUID,
            strName: hierarchy.strUserName || "Unknown",
            strProfileImg: undefined,
          },
        ]
      : [];
    const subordinates = hierarchy?.subordinates || [];
    const mappedSubordinates = subordinates.map((u: Subordinate) => ({
      strUserGUID: u.strUserGUID,
      strName: u.strUserName || "Unknown",
      strProfileImg: u.strProfileImg || undefined,
    }));
    const users = [...baseUsers, ...mappedSubordinates];
    return users.filter(
      (user, index, array) =>
        array.findIndex((item) => item.strUserGUID === user.strUserGUID) ===
        index
    );
  }, [hierarchyQuery.data]);

  const userOptions = useMemo(
    () =>
      assignableUsers.map(
        (u: {
          strUserGUID: string;
          strName: string;
          strProfileImg?: string;
        }) => ({ value: u.strUserGUID, label: u.strName })
      ),
    [assignableUsers]
  );

  const buildExportParams = () => ({
    strBoardGUID: selectedBoard,
    dtFromDate: fromDate || undefined,
    dtToDate: toDate || undefined,
    strUserGUIDs: selectedUser || undefined,
  });

  const handleExportPdf = async () => {
    exportPdfMutation.mutate(buildExportParams(), {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `project-detail-${new Date().getTime()}.pdf`;
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
        link.download = `project-detail-${new Date().getTime()}.xlsx`;
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

    const baseColumns: DataTableColumn<BoardwiseDetailRecord>[] = [
      {
        key: "strUserName",
        header: "User",
        width: "120px",
        cell: (row: BoardwiseDetailRecord) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strUserName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "intTaskNo",
        header: "Task No",
        width: "110px",
        align: "center",
        cell: (row: BoardwiseDetailRecord) => (
          <div className="text-foreground">{row.intTaskNo}</div>
        ),
        sortable: true,
      },
      {
        key: "strTaskName",
        header: "Task Name",
        width: "280px",
        cell: (row: BoardwiseDetailRecord) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strTaskName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strBoardSectionName",
        header: "Module",
        width: "180px",
        cell: (row: BoardwiseDetailRecord) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strBoardSectionName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strBoardSubModuleName",
        header: "Sub Module",
        width: "180px",
        cell: (row: BoardwiseDetailRecord) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strBoardSubModuleName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTicketKey",
        header: "Ticket",
        width: "150px",
        cell: (row: BoardwiseDetailRecord) => (
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
        key: "dblBillableHours",
        header: "Billable Hours",
        width: "150px",
        align: "center",
        cell: (row: BoardwiseDetailRecord) => (
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
        header: "Non-Billable Hours",
        width: "200px",
        align: "center",
        cell: (row: BoardwiseDetailRecord) => (
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
        (col): col is DataTableColumn<BoardwiseDetailRecord> =>
          col !== undefined
      );
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col space-y-1 mt-6 gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Project Detail
              </h1>
              <p className="text-sm text-muted-foreground">
                Detailed breakdown of user and task hours for a project
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
            placeholder="Search by user or task..."
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
                  "projectDetailReport_column_order",
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
          <div className="w-full sm:w-full md:w-64 lg:w-64">
            <PreloadedSelect
              options={boardOptions}
              selectedValue={selectedBoard}
              onChange={(value) => {
                setSelectedBoard(value);
                setSelectedUser("");
                setDisplayClicked(false);
              }}
              placeholder={
                boardsQuery.isLoading ? "Loading projects..." : "Select project"
              }
              isLoading={boardsQuery.isLoading}
              onOpenChange={setBoardDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-full md:w-64 lg:w-64">
            <PreloadedSelect
              options={userOptions}
              selectedValue={selectedUser}
              onChange={(value) => {
                setSelectedUser(value);
                setDisplayClicked(false);
              }}
              placeholder={
                selectedBoard ? "All users" : "Select a project first"
              }
              isLoading={hierarchyQuery.isLoading}
              disabled={!selectedBoard || hierarchyQuery.isLoading}
              allowNone
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
                setSelectedUser("");
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
              view the detail report.
            </p>
          </Card>
        ) : isLoading ? (
          <TableSkeleton
            columns={[
              "User",
              "Task No",
              "Task Name",
              "Section",
              "Sub Module",
              "Ticket",
              "Billable Hours",
              "Non-Billable",
            ]}
            pageSize={10}
          />
        ) : (
          <>
            {userTotals.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {userTotals.map((userTotal) => (
                  <div
                    key={userTotal.strUserGUID}
                    className="p-3 bg-card border border-border-color rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="font-medium text-sm text-foreground mb-2">
                      {userTotal.strUserName}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Total Billable:
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
                          <Timer className="h-3.5 w-3.5 text-emerald-500" />
                          {userTotal.strTotalBillableHours}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Total Non-Billable:
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
                          <Timer className="h-3.5 w-3.5 text-amber-700" />
                          {userTotal.strTotalNonBillableHours}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DataTable
              data={sortedDetails}
              columns={orderedColumns}
              keyExtractor={(row: BoardwiseDetailRecord) =>
                `${row.strUserGUID}-${row.strTaskGUID}`
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
                  <>No records found matching "{debouncedSearch}".</>
                ) : (
                  <>No detail data found for the selected filters.</>
                )
              }
              maxHeight="calc(93vh - 350px)"
            />
          </>
        )}
      </div>

      <ModalDialog
        open={isPreviewModalOpen}
        onOpenChange={handleClosePreviewModal}
        title="Project Detail Preview"
        maxWidth="1200px"
        fullHeight={true}
        showCloseButton={true}
      >
        {previewPdfUrl && (
          <iframe
            src={previewPdfUrl}
            className="w-full h-full min-h-150"
            title="Project Detail PDF Preview"
          />
        )}
      </ModalDialog>
    </CustomContainer>
  );
};

export default ProjectDetailReport;
