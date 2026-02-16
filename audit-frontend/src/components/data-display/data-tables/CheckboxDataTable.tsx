import React, { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// Define types for the DocumentTable component
export interface DocumentTableColumn<T> {
  key: string;
  header: string | React.ReactNode;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string; // Optional width for the column
}

export interface DocumentTableProps<T> {
  data: T[];
  columns: DocumentTableColumn<T>[];
  keyExtractor: (item: T) => string;
  sortBy?: string;
  ascending?: boolean;
  onSort?: (column: string) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  pagination?: {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  pageSizeOptions?: number[];
  columnVisibility?: { [key: string]: boolean };
  alwaysVisibleColumns?: string[];
  maxHeight?: string; // Add this prop to control the table body's max height
  minHeight?: string; // Add this prop to control the table body's min height
  isTextWrapped?: boolean; // Whether to wrap text in table cells
  pinnedColumns?: string[]; // Array of column keys that should be pinned
  onRowClick?: (item: T) => void; // Callback when a row is clicked
  columnWidths?: { [key: string]: number }; // Column widths in pixels
  onColumnWidthsChange?: (widths: { [key: string]: number }) => void; // Callback when column widths change
}

function DocumentTableComponent<T>({
  data,
  columns,
  keyExtractor,
  sortBy,
  ascending = true,
  onSort,
  loading = false,
  emptyState,
  pagination,
  pageSizeOptions = [5, 10, 20, 50],
  columnVisibility,
  alwaysVisibleColumns = ["actions"],
  maxHeight,
  minHeight = "100px",
  isTextWrapped = false,
  pinnedColumns = [],
  onRowClick,
  columnWidths = {},
  onColumnWidthsChange,
}: DocumentTableProps<T>) {
  // Reference to the table element and scrollable container
  const tableRef = React.useRef<HTMLTableElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Column resize state
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [tempColumnWidths, setTempColumnWidths] = useState<{
    [key: string]: number;
  }>(columnWidths);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingWidths, setPendingWidths] = useState<{
    [key: string]: number;
  } | null>(null);
  const resizeStartX = React.useRef<number>(0);
  const resizeStartWidth = React.useRef<number>(0);
  const isResizingRef = React.useRef<boolean>(false);
  const widthsRef = React.useRef<{ [key: string]: number }>(columnWidths);

  // Keep widthsRef in sync with current state
  React.useEffect(() => {
    widthsRef.current = tempColumnWidths;
  }, [tempColumnWidths]);

  // Sync columnWidths from props when not resizing
  React.useEffect(() => {
    if (!isResizingRef.current) {
      setTempColumnWidths(columnWidths);
    }
  }, [columnWidths]);

  // Handle resize start
  const handleResizeStart = useCallback(
    (columnKey: string, startX: number, currentWidth: number) => {
      isResizingRef.current = true;
      setResizingColumn(columnKey);
      resizeStartX.current = startX;
      resizeStartWidth.current = currentWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    []
  );

  // Handle resize move
  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingColumn) return;

      const diff = e.clientX - resizeStartX.current;
      const newWidth = Math.max(80, resizeStartWidth.current + diff); // Minimum width of 80px

      setTempColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }));
    },
    [resizingColumn]
  );

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    if (resizingColumn) {
      // Use the ref value to avoid stale closure issues
      const currentWidths = widthsRef.current;
      const hasChanged =
        currentWidths[resizingColumn] !== columnWidths[resizingColumn];

      if (hasChanged && onColumnWidthsChange) {
        setPendingWidths(currentWidths);
        setShowSaveDialog(true);
      }
      isResizingRef.current = false;
      setResizingColumn(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, [resizingColumn, columnWidths, onColumnWidthsChange]);

  // Handle save confirmation
  const handleSaveWidths = useCallback(() => {
    if (pendingWidths && onColumnWidthsChange) {
      onColumnWidthsChange(pendingWidths);
    }
    setShowSaveDialog(false);
    setPendingWidths(null);
  }, [pendingWidths, onColumnWidthsChange]);

  // Handle cancel
  const handleCancelWidths = useCallback(() => {
    setTempColumnWidths(columnWidths);
    setShowSaveDialog(false);
    setPendingWidths(null);
  }, [columnWidths]);

  // Add mouse event listeners for resize
  React.useEffect(() => {
    if (resizingColumn) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);

      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  // Effect to handle scroll events and ensure pinned columns stay visible
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;

      const handleScroll = () => {
        // When scrolling horizontally, ensure pinned columns maintain their position
        const pinnedCells =
          tableRef.current?.querySelectorAll(".column-pinned");
        if (pinnedCells) {
          pinnedCells.forEach((cell) => {
            // Refresh the sticky position to force browser to maintain proper rendering
            const element = cell as HTMLElement;
            const currentLeft = element.style.left;
            if (currentLeft) {
              // Temporarily toggle the left position to force a refresh
              element.style.left = `calc(${currentLeft} + 0.1px)`;
              // Use requestAnimationFrame to minimize performance impact
              requestAnimationFrame(() => {
                element.style.left = currentLeft;
              });
            }
          });
        }
      };

      // Add scroll listener
      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  // Effect to ensure pinned columns maintain consistent backgrounds
  React.useEffect(() => {
    if (tableRef.current) {
      const allCells = tableRef.current.querySelectorAll("th, td");
      allCells.forEach((cell) => {
        const element = cell as HTMLElement;
        element.classList.remove("column-pinned");
        element.style.position = "";
        element.style.left = "";
        element.style.zIndex = "";
      });

      let offset = 0;

      // Always pin the Actions column first if it exists
      const actionsCells = tableRef.current.querySelectorAll(
        '[data-column-key="actions"], [data-column-key="action"]'
      );

      if (actionsCells.length > 0) {
        actionsCells.forEach((cell) => {
          const element = cell as HTMLElement;
          element.classList.add("column-pinned", "column-pinned-actions");
          element.style.position = "sticky";
          element.style.left = `${offset}px`;
          element.style.zIndex = "5";
        });
        offset += (actionsCells[0] as HTMLElement).offsetWidth;
      }

      // Process each pinned column (user-selected)
      pinnedColumns.forEach((columnKey, index) => {
        // Skip if it's the actions column, as it's already handled
        if (columnKey === "actions" || columnKey === "action") return;

        const columnCells = tableRef.current!.querySelectorAll(
          `[data-column-key="${columnKey}"]`
        );

        if (columnCells.length > 0) {
          columnCells.forEach((cell) => {
            const element = cell as HTMLElement;
            element.classList.add(
              "column-pinned",
              `column-pinned-${index + 1}`
            );
            element.style.position = "sticky";
            element.style.left = `${offset}px`;
            element.style.zIndex = "5";
          });
          offset += (columnCells[0] as HTMLElement).offsetWidth;
        }
      });

      // Add padding to the first non-pinned cell in each row to prevent overlap
      if (pinnedColumns.length > 0 || actionsCells.length > 0) {
        // Process each row to find non-pinned cells that need styling

        // Apply padding to the first non-pinned cell in each row
        const rows = tableRef.current.querySelectorAll("tr");
        rows.forEach((row) => {
          let firstNonPinnedCell: HTMLElement | null = null;

          // Find the first non-pinned cell in this row
          const cells = Array.from(row.querySelectorAll("th, td"));
          for (const cell of cells) {
            const cellElement = cell as HTMLElement;
            const columnKey = cellElement.getAttribute("data-column-key");

            // Check if it's the Actions column
            const isActionsColumn =
              columnKey === "actions" || columnKey === "action";

            // Check if it's a user-pinned column
            const isUserPinned = pinnedColumns.some((key) => columnKey === key);

            // Skip special columns (like the scrollbar column) that don't have a data-column-key
            if (!columnKey) {
              continue;
            }

            // If neither Actions nor user-pinned, it's our first non-pinned cell
            if (!isActionsColumn && !isUserPinned) {
              firstNonPinnedCell = cellElement;
              break;
            }
          }

          // Apply padding to create space after pinned columns
          if (firstNonPinnedCell) {
            firstNonPinnedCell.style.paddingLeft = "8px"; // Reduced padding for less spacing
            firstNonPinnedCell.classList.add("after-pinned"); // Add class for additional styling

            // Make sure any previously added padding is removed from other cells
            const otherCells = Array.from(
              row.querySelectorAll(
                "th:not(.column-pinned), td:not(.column-pinned)"
              )
            );
            otherCells.forEach((otherCell) => {
              if (otherCell !== firstNonPinnedCell) {
                (otherCell as HTMLElement).classList.remove("after-pinned");
                (otherCell as HTMLElement).style.paddingLeft = "";
              }
            });
          }
        });
      }
    }
  }, [pinnedColumns, data, columnVisibility]);

  // Calculate column order based on pinned columns
  const orderedColumns = React.useMemo(() => {
    const visibleColumns = columns.filter(
      (col) =>
        columnVisibility?.[col.key] !== false ||
        alwaysVisibleColumns.includes(col.key)
    );

    // Separate pinned and unpinned columns
    const pinnedCols: typeof columns = [];
    const unpinnedCols: typeof columns = [];

    // Always add actions/action column first if it exists
    const actionsColumn = visibleColumns.find(
      (col) =>
        col.key === "actions" ||
        col.key === "action" ||
        (typeof col.header === "string" &&
          col.header.toLowerCase() === "actions")
    );
    if (actionsColumn) {
      pinnedCols.push(actionsColumn);
    }

    // Add other pinned columns
    pinnedColumns.forEach((key) => {
      const col = visibleColumns.find((c) => c.key === key);
      if (col && col !== actionsColumn) {
        pinnedCols.push(col);
      }
    });

    // Add unpinned columns
    visibleColumns.forEach((col) => {
      if (!pinnedCols.includes(col)) {
        unpinnedCols.push(col);
      }
    });

    return [...pinnedCols, ...unpinnedCols];
  }, [columns, columnVisibility, alwaysVisibleColumns, pinnedColumns]);

  const handleSort = (column: DocumentTableColumn<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  const renderSortIcon = (column: DocumentTableColumn<T>) => {
    if (!column.sortable) return null;

    if (sortBy === column.key) {
      return ascending ? (
        <ArrowUp className="inline ml-1 h-4 w-4" />
      ) : (
        <ArrowDown className="inline ml-1 h-4 w-4" />
      );
    }

    return <ArrowUpDown className="inline ml-1 h-4 w-4 opacity-30" />;
  };

  return (
    <>
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Save Column Width Changes?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to save the column width changes you just made?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelWidths}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveWidths}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardContent className="p-0 rounded-lg overflow-hidden">
        <div className="w-full relative overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border"></div>
            </div>
          ) : (
            <div
              className="w-full overflow-auto scrollbar-thin scrollbar-thumb-[#c1c1c1] scrollbar-track-[#f1f1f1] dark:scrollbar-thumb-[#4a4a4a] dark:scrollbar-track-[#1e1e1e]"
              ref={scrollContainerRef}
              style={{
                maxHeight: maxHeight || "none",
                minHeight: minHeight || "none",
                scrollbarGutter: "stable",
              }}
            >
              <div className="w-full">
                <table
                  ref={tableRef}
                  className="w-max min-w-full border-collapse"
                  style={{ borderSpacing: 0 }}
                >
                  <thead className="sticky top-0 z-10 bg-(--table-header-bg) shadow-[0_2px_4px_rgba(0,0,0,0.05)] visible table-header-group">
                    <tr>
                      {orderedColumns.map((column) => {
                        // Check if this is an Actions column
                        const isActionsColumn =
                          (typeof column.header === "string" &&
                            column.header.toLowerCase() === "actions") ||
                          column.key === "actions" ||
                          column.key === "action";

                        // Determine if this column is pinned
                        const isPinned =
                          isActionsColumn ||
                          (pinnedColumns && pinnedColumns.includes(column.key));

                        // For Actions column, always use index 0, otherwise use its position in pinnedColumns
                        const pinnedIndex = isActionsColumn
                          ? 0
                          : isPinned
                            ? pinnedColumns.indexOf(column.key)
                            : -1;

                        // Get pinned column class with proper z-index
                        const pinnedClass = isPinned
                          ? isActionsColumn
                            ? "sticky left-0 z-[6] bg-(--table-header-bg) isolate"
                            : pinnedIndex === 0
                              ? "sticky z-[5] bg-(--table-header-bg) isolate"
                              : pinnedIndex === 1
                                ? "sticky z-[4] bg-(--table-header-bg) isolate"
                                : "sticky z-[3] bg-(--table-header-bg) isolate"
                          : "";

                        // Determine width for actions column
                        const cellWidthClass =
                          column.key === "actions" || column.key === "action"
                            ? "w-[60px] min-w-[60px] overflow-visible"
                            : "min-w-[80px] overflow-hidden text-ellipsis";

                        const columnWidth =
                          tempColumnWidths[column.key] ||
                          columnWidths[column.key];
                        const widthStyle = columnWidth
                          ? `${columnWidth}px`
                          : column.width || "auto";
                        const isResizing = resizingColumn === column.key;
                        const isAnyColumnResizing = resizingColumn !== null;

                        return (
                          <th
                            key={column.key}
                            onClick={(e) => {
                              // Don't sort if clicking on resize handle
                              if (
                                (e.target as HTMLElement).closest(
                                  ".resize-handle"
                                )
                              ) {
                                return;
                              }
                              handleSort(column);
                            }}
                            className={`px-3 py-2 text-left font-medium text-muted-foreground transition-all align-middle bg-(--table-header-bg) ${pinnedClass} ${cellWidthClass} ${
                              column.sortable
                                ? "cursor-pointer select-none"
                                : ""
                            } relative group`}
                            style={{
                              width: widthStyle,
                              minWidth: widthStyle,
                              maxWidth: widthStyle,
                              transition: isResizing
                                ? "none"
                                : "width 0.15s ease-out",
                            }}
                            data-column-key={column.key}
                          >
                            <div className="flex items-center gap-1">
                              <span>{column.header}</span>
                              {renderSortIcon(column)}
                            </div>
                            <div
                              className={`resize-handle absolute right-0 top-0 h-full cursor-col-resize transition-all duration-200 ease-in-out ${
                                isResizing
                                  ? "bg-black/50 dark:bg-white/50 w-0.75 opacity-100"
                                  : isAnyColumnResizing
                                    ? "w-[3.5px] opacity-0 pointer-events-none"
                                    : "w-[3.5px] hover:bg-black/50 dark:hover:bg-white/50 group-hover:bg-black/40 dark:group-hover:bg-white/40 opacity-0 group-hover:opacity-100"
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const th = e.currentTarget.parentElement;
                                if (th) {
                                  const currentWidth =
                                    th.getBoundingClientRect().width;
                                  handleResizeStart(
                                    column.key,
                                    e.clientX,
                                    currentWidth
                                  );
                                }
                              }}
                            />
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr className="bg-card">
                        <td
                          colSpan={orderedColumns.length}
                          className="text-center h-32 text-muted-foreground bg-inherit"
                        >
                          {emptyState || "No data found."}
                        </td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr
                          key={keyExtractor(item)}
                          onClick={(e) => {
                            // Prevent row click when clicking on interactive elements
                            const target = e.target as HTMLElement;
                            const isInteractive = target.closest(
                              'button, a, input, [role="button"], [role="checkbox"]'
                            );
                            if (!isInteractive && onRowClick) {
                              onRowClick(item);
                            }
                          }}
                          className={`group/row bg-card ${
                            onRowClick ? "cursor-pointer" : ""
                          }`}
                        >
                          {orderedColumns.map((column) => {
                            // Check if this is an Actions column
                            const isActionsColumn =
                              (typeof column.header === "string" &&
                                column.header.toLowerCase() === "actions") ||
                              column.key === "actions" ||
                              column.key === "action";

                            // Determine if this column is pinned and its index in the pinned columns
                            const isPinned =
                              isActionsColumn ||
                              (pinnedColumns &&
                                pinnedColumns.includes(column.key));

                            // For Actions column, always use index 0, otherwise use its position in pinnedColumns
                            const pinnedIndex = isActionsColumn
                              ? 0
                              : isPinned
                                ? pinnedColumns.indexOf(column.key)
                                : -1;

                            // Get pinned column class with proper z-index
                            const pinnedClass = isPinned
                              ? isActionsColumn
                                ? "sticky left-0 z-[6] bg-inherit isolate"
                                : pinnedIndex === 0
                                  ? "sticky z-[5] bg-inherit isolate"
                                  : pinnedIndex === 1
                                    ? "sticky z-[4] bg-inherit isolate"
                                    : "sticky z-[3] bg-inherit isolate"
                              : "";

                            // Determine width for actions column
                            const cellWidthClass =
                              column.key === "actions" ||
                              column.key === "action"
                                ? "w-[60px] min-w-[60px] overflow-visible"
                                : "min-w-[80px] overflow-hidden text-ellipsis";

                            const textClass = isTextWrapped
                              ? "whitespace-normal wrap-break-word overflow-visible"
                              : "whitespace-nowrap overflow-hidden text-ellipsis";

                            return (
                              <td
                                key={`${keyExtractor(item)}-${column.key}`}
                                className={`px-3 py-2 text-foreground transition-all align-middle bg-inherit ${pinnedClass} ${cellWidthClass} ${textClass}`}
                                style={{ width: column.width || "auto" }}
                                data-column-key={column.key}
                              >
                                {column.cell(item)}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination && !loading && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              {/* Items per page dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-foreground whitespace-nowrap">
                  Items per page:
                </span>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={(value) =>
                    pagination.onPageSizeChange(Number(value))
                  }
                >
                  <SelectTrigger className="w-17.5 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Showing X to Y of Z items */}
              <div className="hidden sm:flex items-center text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium mx-1">
                  {data.length > 0
                    ? (pagination.pageNumber - 1) * pagination.pageSize + 1
                    : 0}
                </span>{" "}
                to{" "}
                <span className="font-medium mx-1">
                  {Math.min(
                    pagination.pageNumber * pagination.pageSize,
                    pagination.totalCount
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium mx-1">
                  {pagination.totalCount}
                </span>{" "}
                items
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => pagination.onPageChange(1)}
                  disabled={pagination.pageNumber === 1}
                  className="h-8 w-8 border border-border-color"
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="sr-only">First page</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    pagination.onPageChange(pagination.pageNumber - 1)
                  }
                  disabled={pagination.pageNumber === 1}
                  className="h-8 w-8 border border-border-color"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>

                <span className="text-sm whitespace-nowrap mx-1.5 text-foreground">
                  Page{" "}
                  <span className="font-medium">{pagination.pageNumber}</span>{" "}
                  of{" "}
                  <span className="font-medium">{pagination.totalPages}</span>
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    pagination.onPageChange(pagination.pageNumber + 1)
                  }
                  disabled={pagination.pageNumber === pagination.totalPages}
                  className="h-8 w-8 border border-border-color"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => pagination.onPageChange(pagination.totalPages)}
                  disabled={pagination.pageNumber === pagination.totalPages}
                  className="h-8 w-8 border border-border-color"
                >
                  <ChevronsRight className="h-4 w-4" />
                  <span className="sr-only">Last page</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </>
  );
}

// Export the memoized component
export const DocumentTable = memo(
  DocumentTableComponent
) as typeof DocumentTableComponent;
