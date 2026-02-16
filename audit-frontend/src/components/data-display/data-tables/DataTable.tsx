import React, { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

// Define types for the DataTable component
export interface DataTableColumn<T> {
  key: string;
  header: string | React.ReactNode;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string; // Optional width for the column
  align?: "left" | "center" | "right"; // Text alignment for header and cells
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
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
  maxHeight?: string; // Controls scrollable viewport height; defaults to list-view max height
  minHeight?: string; // Add this prop to control the table body's min height
  isTextWrapped?: boolean; // Whether to wrap text in table cells
  pinnedColumns?: string[]; // Array of column keys that should be pinned
  columnWidths?: { [key: string]: number }; // Column widths in pixels
  onColumnWidthsChange?: (widths: { [key: string]: number }) => void; // Callback when column widths change
}

function DataTableComponent<T>({
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
  columnWidths = {},
  onColumnWidthsChange,
}: DataTableProps<T>) {
  const resolvedMaxHeight = maxHeight ?? "calc(100vh - 350px)";

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

  React.useEffect(() => {
    setTempColumnWidths(columnWidths);
  }, [columnWidths]);

  // Handle resize start
  const handleResizeStart = useCallback(
    (columnKey: string, startX: number, currentWidth: number) => {
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
      const hasChanged =
        tempColumnWidths[resizingColumn] !== columnWidths[resizingColumn];
      if (hasChanged && onColumnWidthsChange) {
        setPendingWidths(tempColumnWidths);
        setShowSaveDialog(true);
      }
      setResizingColumn(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, [resizingColumn, tempColumnWidths, columnWidths, onColumnWidthsChange]);

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

      // Cleanup
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  // Effect to calculate and set positions of pinned columns
  React.useEffect(() => {
    if (tableRef.current) {
      // Always run this effect as Actions column is always pinned
      // First, reset any previously set left positions and ensure sticky position
      const allCells = tableRef.current.querySelectorAll("th, td");
      allCells.forEach((cell) => {
        const element = cell as HTMLElement;
        // Reset left position for non-pinned cells
        if (!element.classList.contains("column-pinned")) {
          element.style.left = "";
          element.style.position = ""; // Ensure position is reset
          // For non-pinned columns, add padding-left if there are pinned columns
          if (pinnedColumns.length > 0) {
            element.style.paddingLeft = "";
          }
        } else {
          // Ensure sticky position for pinned cells
          element.style.position = "sticky";
        }
      });

      // Calculate positions of pinned columns in visual order
      // Get the header row to determine the visual order of columns
      const headerRow = tableRef.current.querySelector("thead tr");
      if (!headerRow) return;

      let accumulatedWidth = 0;

      // Process columns in visual order (as they appear in the DOM)
      const headerCells = Array.from(headerRow.querySelectorAll("th"));
      for (const headerCell of headerCells) {
        const columnKey = (headerCell as HTMLElement).getAttribute(
          "data-column-key"
        );
        if (!columnKey) continue;

        const isActionsColumn =
          columnKey === "actions" || columnKey === "action";
        const isPinned =
          isActionsColumn ||
          (pinnedColumns && pinnedColumns.includes(columnKey));

        if (isPinned) {
          // Get all cells for this column (header and body)
          const columnCells = tableRef.current.querySelectorAll(
            `th[data-column-key="${columnKey}"], td[data-column-key="${columnKey}"]`
          );

          if (columnCells.length > 0) {
            // Set left position based on accumulated width
            columnCells.forEach((cell) => {
              (cell as HTMLElement).style.left = `${accumulatedWidth}px`;
            });

            // Update accumulated width for next column position
            const firstCell = columnCells[0] as HTMLElement;
            if (firstCell) {
              accumulatedWidth += firstCell.getBoundingClientRect().width;
            }
          }
        }
      }

      // Add padding to the first non-pinned cell in each row to prevent overlap
      if (pinnedColumns.length > 0) {
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
  }, [pinnedColumns, data, columnVisibility, isTextWrapped]); // Recalculate when these change

  // Filter columns based on visibility settings
  const visibleColumns = React.useMemo(() => {
    if (!columnVisibility) {
      return columns;
    }

    // First, always include actions column and other always visible columns, and filter others by visibility
    const filteredColumns = columns.filter(
      (column) =>
        column.key === "actions" ||
        column.key === "action" ||
        alwaysVisibleColumns.includes(column.key) ||
        columnVisibility[column.key] !== false
    );

    // Then, de-duplicate columns with the same header name or key
    // Keep track of the headers and keys we've seen
    const seenHeaders = new Set<string>();
    const seenKeys = new Set<string>();

    return filteredColumns.filter((column) => {
      // For Actions columns, special handling to ensure only one exists
      if (
        column.key === "actions" ||
        column.key === "action" ||
        (typeof column.header === "string" &&
          column.header.toLowerCase() === "actions")
      ) {
        if (seenHeaders.has("actions")) {
          return false; // Skip this duplicate Actions column
        }
        seenHeaders.add("actions");
        return true;
      }

      // For other columns, check if we've seen this key or header before
      const headerKey =
        typeof column.header === "string" ? column.header.toLowerCase() : null;
      if (headerKey && seenHeaders.has(headerKey)) {
        return false; // Skip duplicate header
      }
      if (seenKeys.has(column.key)) {
        return false; // Skip duplicate key
      }

      // Mark this header and key as seen
      if (headerKey) seenHeaders.add(headerKey);
      seenKeys.add(column.key);

      return true;
    });
  }, [columns, columnVisibility, alwaysVisibleColumns]);

  // Reorganize columns to put Actions first, then pinned columns
  const orderedColumns = React.useMemo(() => {
    // Make a copy of the columns array to avoid mutating props
    let columnsCopy = [...visibleColumns];

    // Remove all duplicate Actions columns - only keep one
    const actionsColumns = columnsCopy.filter(
      (col) =>
        (typeof col.header === "string" &&
          col.header.toLowerCase() === "actions") ||
        col.key === "actions"
    );

    // Remove all Actions columns
    columnsCopy = columnsCopy.filter(
      (col) =>
        !(
          typeof col.header === "string" &&
          col.header.toLowerCase() === "actions"
        ) && col.key !== "actions"
    );

    // Only keep the first Actions column if there are multiple
    if (actionsColumns.length > 0) {
      // Add the first Actions column back at the beginning
      columnsCopy.unshift(actionsColumns[0]);
    }

    // If we have pinned columns, ensure they're at the beginning (after Actions)
    if (pinnedColumns && pinnedColumns.length > 0) {
      // Filter out actions columns since we've already handled them
      const pinnedNonActionsKeys = pinnedColumns.filter(
        (key) => key !== "actions" && key !== "action"
      );

      // Filter out pinned columns from the copy (in case they're already there)
      const nonPinnedColumns = columnsCopy.filter(
        (col) => !pinnedNonActionsKeys.includes(col.key)
      );

      // Collect pinned columns in the correct order
      const pinnedColumnsInOrder = pinnedNonActionsKeys
        .map((key) => columnsCopy.find((col) => col.key === key))
        .filter(Boolean) as DataTableColumn<T>[];

      // Get the Actions column if we have it (should be the first item in columnsCopy now)
      const actionsColumn =
        columnsCopy.length > 0 &&
        (columnsCopy[0].key === "actions" ||
          columnsCopy[0].key === "action" ||
          (typeof columnsCopy[0].header === "string" &&
            columnsCopy[0].header.toLowerCase() === "actions"))
          ? [columnsCopy[0]]
          : [];

      // Remove Actions column from nonPinnedColumns if it exists
      const filteredNonPinnedColumns =
        actionsColumn.length > 0
          ? nonPinnedColumns.filter((col) => col.key !== actionsColumn[0].key)
          : nonPinnedColumns;

      // Reconstruct the columns array with Actions first, then pinned, then the rest
      columnsCopy = [
        ...actionsColumn,
        ...pinnedColumnsInOrder,
        ...filteredNonPinnedColumns,
      ];
    }

    return columnsCopy;
  }, [visibleColumns, pinnedColumns]);

  const showInitialLoading = loading && data.length === 0;

  // Render sortable header cell
  const renderSortableHeader = (column: DataTableColumn<T>) => {
    const justifyClass =
      column.align === "center"
        ? "justify-center"
        : column.align === "right"
          ? "justify-end"
          : "justify-start";
    const headerContent =
      typeof column.header === "string" ? (
        <span>{column.header}</span>
      ) : (
        column.header
      );

    if (!column.sortable || !onSort) {
      return (
        <div className={`flex w-full items-center ${justifyClass}`}>
          {headerContent}
        </div>
      );
    }

    return (
      <div
        className={`flex w-full items-center gap-1 cursor-pointer ${justifyClass}`}
        onClick={() => onSort(column.key)}
      >
        {headerContent}
        {sortBy === column.key ? (
          ascending ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    );
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

      <Card className="shadow-md overflow-hidden">
        <CardContent className="p-0 relative">
          {showInitialLoading ? (
            <div className="text-center py-8">Loading data...</div>
          ) : (
            <div
              className=" w-full relative overflow-hidden flex flex-col"
              style={
                maxHeight || minHeight
                  ? ({
                      "--max-height": resolvedMaxHeight,
                      "--min-height": minHeight,
                    } as React.CSSProperties)
                  : {}
              }
            >
              {/* Single scrollable container with sticky header */}
              <div
                ref={scrollContainerRef}
                className="w-full overflow-auto "
                style={{
                  maxHeight: resolvedMaxHeight,
                  minHeight: minHeight || "none",
                  scrollbarGutter: "stable",
                }}
              >
                {/* Single table with a sticky header and scrollable body */}
                <table
                  ref={tableRef}
                  className="w-max min-w-full border-collapse"
                  style={{
                    borderSpacing: 0,
                  }}
                >
                  {/* Sticky header */}
                  <thead className="sticky top-0 z-10 bg-(--table-header-bg) shadow-[0_2px_4px_rgba(0,0,0,0.05)] visible table-header-group">
                    <tr>
                      {orderedColumns.map((column, columnIndex) => {
                        // Determine if this column is pinned and its index in the pinned columns
                        // Actions column is always treated as pinned regardless of pinnedColumns state
                        const isActionsColumn =
                          column.key === "actions" || column.key === "action";
                        const isPinned =
                          isActionsColumn ||
                          (pinnedColumns && pinnedColumns.includes(column.key));

                        // Calculate visual pinned position: count how many pinned columns appear before this one
                        let visualPinnedIndex = -1;
                        if (isPinned) {
                          if (isActionsColumn) {
                            visualPinnedIndex = 0;
                          } else {
                            // Count pinned columns (including Actions) that appear before this column in orderedColumns
                            let pinnedCount = 0;
                            for (let i = 0; i < columnIndex; i++) {
                              const prevColumn = orderedColumns[i];
                              const isPrevActions =
                                prevColumn.key === "actions" ||
                                prevColumn.key === "action";
                              const isPrevPinned =
                                isPrevActions ||
                                (pinnedColumns &&
                                  pinnedColumns.includes(prevColumn.key));
                              if (isPrevPinned) {
                                pinnedCount++;
                              }
                            }
                            visualPinnedIndex = pinnedCount;
                          }
                        }

                        // Get pinned column class with proper z-index
                        // Higher z-index for columns further left (lower visual index)
                        // z-index: 6 for position 0, 5 for position 1, 4 for position 2, etc.
                        const getZIndex = (pos: number) => {
                          if (pos === 0) return "z-[6]";
                          if (pos === 1) return "z-[5]";
                          if (pos === 2) return "z-[4]";
                          if (pos === 3) return "z-[3]";
                          if (pos === 4) return "z-[2]";
                          return "z-[1]";
                        };

                        const pinnedClass = isPinned
                          ? `column-pinned sticky ${getZIndex(visualPinnedIndex)} bg-(--table-header-bg) isolate`
                          : "";

                        // Determine width for actions column
                        const cellWidthClass =
                          column.key === "actions" || column.key === "action"
                            ? "w-[60px] min-w-[60px] overflow-visible"
                            : "min-w-[80px] overflow-hidden text-ellipsis";

                        // Determine text alignment class
                        const alignClass =
                          column.align === "center"
                            ? "text-center"
                            : column.align === "right"
                              ? "text-right"
                              : "text-left";

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
                            className={`px-3 py-2 font-medium text-muted-foreground align-middle bg-(--table-header-bg) ${pinnedClass} ${cellWidthClass} ${alignClass} relative group`}
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
                            {renderSortableHeader(column)}
                            <div
                              className={`absolute right-0 top-0 h-full cursor-col-resize transition-all duration-200 ease-in-out ${
                                isResizing
                                  ? "bg-black/50 dark:bg-white/50 w-0.75 opacity-100"
                                  : isAnyColumnResizing
                                    ? "w-[3.5px] opacity-0 pointer-events-none"
                                    : "w-[3.5px] hover:bg-black/50 dark:hover:bg-white/50 group-hover:bg-black/40 dark:group-hover:bg-white/40 opacity-0 group-hover:opacity-100"
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
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

                  {/* Table body - directly add tbody without extra hidden thead */}
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
                        <tr key={keyExtractor(item)} className="bg-card">
                          {orderedColumns.map((column, columnIndex) => {
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

                            // Calculate visual pinned position: count how many pinned columns appear before this one
                            let visualPinnedIndex = -1;
                            if (isPinned) {
                              if (isActionsColumn) {
                                visualPinnedIndex = 0;
                              } else {
                                // Count pinned columns (including Actions) that appear before this column in orderedColumns
                                let pinnedCount = 0;
                                for (let i = 0; i < columnIndex; i++) {
                                  const prevColumn = orderedColumns[i];
                                  const isPrevActions =
                                    prevColumn.key === "actions" ||
                                    prevColumn.key === "action";
                                  const isPrevPinned =
                                    isPrevActions ||
                                    (pinnedColumns &&
                                      pinnedColumns.includes(prevColumn.key));
                                  if (isPrevPinned) {
                                    pinnedCount++;
                                  }
                                }
                                visualPinnedIndex = pinnedCount;
                              }
                            }

                            // Get pinned column class with proper z-index
                            // Higher z-index for columns further left (lower visual index)
                            // z-index: 6 for position 0, 5 for position 1, 4 for position 2, etc.
                            const getZIndex = (pos: number) => {
                              if (pos === 0) return "z-[6]";
                              if (pos === 1) return "z-[5]";
                              if (pos === 2) return "z-[4]";
                              if (pos === 3) return "z-[3]";
                              if (pos === 4) return "z-[2]";
                              return "z-[1]";
                            };

                            const pinnedClass = isPinned
                              ? `column-pinned sticky ${getZIndex(visualPinnedIndex)} bg-inherit isolate`
                              : "";

                            // Determine width for actions column
                            const cellWidthClass =
                              column.key === "actions" ||
                              column.key === "action"
                                ? "w-[60px] min-w-[60px] overflow-visible"
                                : "min-w-[80px] overflow-hidden text-ellipsis";

                            const textClass = isTextWrapped
                              ? "block max-w-full whitespace-normal wrap-break-word"
                              : "block max-w-full whitespace-nowrap overflow-hidden text-ellipsis";

                            // Determine text alignment class
                            const alignClass =
                              column.align === "center"
                                ? "text-center"
                                : column.align === "right"
                                  ? "text-right"
                                  : "text-left";

                            return (
                              <td
                                key={`${keyExtractor(item)}-${column.key}`}
                                className={`px-3 py-2 transition-all align-middle bg-inherit ${pinnedClass} ${cellWidthClass} ${alignClass}`}
                                style={{
                                  width: column.width || "auto",
                                  minWidth: column.width || "80px",
                                  maxWidth: column.width || "auto",
                                }}
                                data-column-key={column.key}
                              >
                                {isActionsColumn ? (
                                  column.cell(item)
                                ) : (
                                  <div className={textClass}>
                                    {column.cell(item)}
                                  </div>
                                )}
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
          {pagination && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              {/* Items per page dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-foreground whitespace-nowrap">
                  Items per page:
                </span>
                <Select
                  value={(pagination.pageSize || 10).toString()}
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
                    ? ((pagination.pageNumber || 1) - 1) *
                        (pagination.pageSize || 10) +
                      1
                    : 0}
                </span>{" "}
                to{" "}
                <span className="font-medium mx-1">
                  {Math.min(
                    (pagination.pageNumber || 1) * (pagination.pageSize || 10),
                    pagination.totalCount || 0
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium mx-1">
                  {pagination.totalCount || 0}
                </span>{" "}
                items
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-1">
                {/* First page */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border border-border-color"
                  onClick={() => pagination.onPageChange(1)}
                  disabled={(pagination.pageNumber || 1) === 1 || loading}
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="sr-only">First page</span>
                </Button>

                {/* Previous page */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border border-border-color"
                  onClick={() =>
                    pagination.onPageChange((pagination.pageNumber || 1) - 1)
                  }
                  disabled={(pagination.pageNumber || 1) === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>

                {/* Page X of Y */}
                <span className="text-sm whitespace-nowrap mx-1.5 text-foreground">
                  Page{" "}
                  <span className="font-medium">
                    {pagination.pageNumber || 1}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {pagination.totalPages || 1}
                  </span>
                </span>

                {/* Next page */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border border-border-color"
                  onClick={() =>
                    pagination.onPageChange((pagination.pageNumber || 1) + 1)
                  }
                  disabled={
                    (pagination.pageNumber || 1) ===
                      (pagination.totalPages || 1) ||
                    (pagination.totalPages || 0) === 0 ||
                    loading
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>

                {/* Last page */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border border-border-color"
                  onClick={() =>
                    pagination.onPageChange(pagination.totalPages || 1)
                  }
                  disabled={
                    (pagination.pageNumber || 1) ===
                      (pagination.totalPages || 1) ||
                    (pagination.totalPages || 0) === 0 ||
                    loading
                  }
                >
                  <ChevronsRight className="h-4 w-4" />
                  <span className="sr-only">Last page</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// Use memo to prevent unnecessary re-renders
const DataTable = memo(DataTableComponent) as typeof DataTableComponent;

export { DataTable };
