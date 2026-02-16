import { useState } from "react";
import {
  Settings,
  RotateCcw,
  WrapText,
  Scissors,
  Pin,
  PinOff,
} from "lucide-react";
import type { DataTableColumn } from "@/components/data-display/data-tables/DataTable";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ColumnVisibilityDropdownProps<T> {
  columns: DataTableColumn<T>[];
  columnVisibility: { [key: string]: boolean };
  toggleColumnVisibility: (key: string) => void;
  resetColumnVisibility: () => void;
  hasVisibleContentColumns: () => boolean;
  getAlwaysVisibleColumns?: () => string[];
  // Button styling is now hardcoded for consistency
  isTextWrapped?: boolean;
  toggleTextWrapping?: () => void;
  pinnedColumns?: string[];
  pinColumn?: (key: string) => void;
  unpinColumn?: (key: string) => void;
  resetPinnedColumns?: () => void;
}

function ColumnVisibilityDropdown<T>({
  columns,
  columnVisibility,
  toggleColumnVisibility,
  resetColumnVisibility,
  hasVisibleContentColumns,
  getAlwaysVisibleColumns,
  isTextWrapped = false,
  toggleTextWrapping,
  pinnedColumns = [],
  pinColumn,
  unpinColumn,
  resetPinnedColumns,
}: ColumnVisibilityDropdownProps<T>) {
  // Get list of always visible columns or default to just "actions"
  const alwaysVisibleColumns = getAlwaysVisibleColumns
    ? getAlwaysVisibleColumns()
    : ["actions"];
  // State to control if dropdown is open
  const [open, setOpen] = useState(false);

  // Create a custom handler to intercept closing behavior
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Always allow opening
      setOpen(true);
    } else {
      // We'll handle closing manually when needed
      // Don't close it automatically when items are clicked
      // but DO close when clicking outside or pressing escape
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 py-2 flex items-center"
        >
          <Settings className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-45"
        sticky="always"
        onCloseAutoFocus={(e) => {
          // Prevent automatic focus handling which can close the dropdown
          e.preventDefault();
        }}
      >
        <DropdownMenuLabel className="font-semibold text-sm">
          Toggle columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Render pinned columns first */}
        {columns
          .filter((col) => pinnedColumns?.includes(col.key))
          .map((column) => (
            <div key={column.key} className="flex items-center">
              <DropdownMenuCheckboxItem
                checked={columnVisibility[column.key] !== false}
                onCheckedChange={() => {
                  toggleColumnVisibility(column.key);
                  // If column is being deselected and it's pinned, unpin it
                  if (
                    columnVisibility[column.key] === true &&
                    pinnedColumns?.includes(column.key) &&
                    unpinColumn
                  ) {
                    unpinColumn(column.key);
                  }
                }}
                className="py-2.5 grow"
                disabled={
                  alwaysVisibleColumns.includes(column.key) ||
                  (columnVisibility[column.key] && !hasVisibleContentColumns())
                }
                // Don't allow click events to close the dropdown
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{column.header}</span>
                  {pinColumn &&
                    unpinColumn &&
                    columnVisibility[column.key] !== false && (
                      <div className="ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            // Don't allow actions column to be unpinned
                            if (column.key !== "actions") {
                              if (pinnedColumns?.includes(column.key)) {
                                unpinColumn(column.key);
                              } else if (
                                (pinnedColumns?.filter((c) => c !== "actions")
                                  ?.length || 0) < 2
                              ) {
                                pinColumn(column.key);
                              }
                            }
                          }}
                          className={`p-1 rounded-sm transition-colors hover:bg-primary/10 ${
                            column.key === "actions"
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={
                            column.key === "actions" ||
                            ((pinnedColumns?.filter((c) => c !== "actions")
                              ?.length || 0) >= 2 &&
                              !pinnedColumns?.includes(column.key))
                          }
                          title={
                            column.key === "actions"
                              ? "Actions column cannot be unpinned"
                              : pinnedColumns?.includes(column.key)
                                ? "Unpin column"
                                : (pinnedColumns?.filter((c) => c !== "actions")
                                      ?.length || 0) >= 2
                                  ? "Limit: 2 pinnable columns + actions"
                                  : "Pin column"
                          }
                        >
                          {column.key === "actions" ? (
                            <PinOff className="h-3.5 w-3.5 text-primary" />
                          ) : pinnedColumns?.includes(column.key) ? (
                            <PinOff className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Pin className="h-3.5 w-3.5 text-primary" />
                          )}
                        </button>
                      </div>
                    )}
                </div>
              </DropdownMenuCheckboxItem>
            </div>
          ))}

        {pinnedColumns &&
          pinnedColumns.length > 0 &&
          columns.some((col) => !pinnedColumns.includes(col.key)) && (
            <DropdownMenuSeparator className="my-1" />
          )}

        {/* Render unpinned columns */}
        {columns
          .filter((col) => !pinnedColumns?.includes(col.key))
          .map((column) => (
            <div key={column.key} className="flex items-center">
              <DropdownMenuCheckboxItem
                checked={columnVisibility[column.key] !== false}
                onCheckedChange={() => {
                  toggleColumnVisibility(column.key);
                  // If column is being deselected and it's pinned, unpin it
                  if (
                    columnVisibility[column.key] === true &&
                    pinnedColumns?.includes(column.key) &&
                    unpinColumn
                  ) {
                    unpinColumn(column.key);
                  }
                }}
                className="py-2.5 grow"
                disabled={
                  alwaysVisibleColumns.includes(column.key) ||
                  (columnVisibility[column.key] && !hasVisibleContentColumns())
                }
                // Don't allow click events to close the dropdown
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{column.header}</span>
                  {pinColumn &&
                    unpinColumn &&
                    columnVisibility[column.key] !== false && (
                      <div className="ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            // Don't allow actions column to be unpinned
                            if (column.key !== "actions") {
                              if (pinnedColumns?.includes(column.key)) {
                                unpinColumn(column.key);
                              } else if (
                                (pinnedColumns?.filter((c) => c !== "actions")
                                  ?.length || 0) < 2
                              ) {
                                pinColumn(column.key);
                              }
                            }
                          }}
                          className={`p-1 rounded-sm transition-colors hover:bg-primary/10 ${
                            column.key === "actions"
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={
                            column.key === "actions" ||
                            ((pinnedColumns?.filter((c) => c !== "actions")
                              ?.length || 0) >= 2 &&
                              !pinnedColumns?.includes(column.key))
                          }
                          title={
                            column.key === "actions"
                              ? "Actions column cannot be unpinned"
                              : pinnedColumns?.includes(column.key)
                                ? "Unpin column"
                                : (pinnedColumns?.filter((c) => c !== "actions")
                                      ?.length || 0) >= 2
                                  ? "Limit: 2 pinnable columns + actions"
                                  : "Pin column"
                          }
                        >
                          {column.key === "actions" ? (
                            <PinOff className="h-3.5 w-3.5 text-primary" />
                          ) : pinnedColumns?.includes(column.key) ? (
                            <PinOff className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Pin className="h-3.5 w-3.5 text-primary" />
                          )}
                        </button>
                      </div>
                    )}
                </div>
              </DropdownMenuCheckboxItem>
            </div>
          ))}

        <DropdownMenuSeparator />
        {toggleTextWrapping && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              toggleTextWrapping();
            }}
            className="py-2.5"
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center">
                {isTextWrapped ? (
                  <Scissors className="mr-2 h-4 w-4" />
                ) : (
                  <WrapText className="mr-2 h-4 w-4" />
                )}
                {isTextWrapped ? "Clip text" : "Wrap text"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleTextWrapping();
                }}
                className="p-1 rounded-sm hover:bg-primary/10"
                title={isTextWrapped ? "Clip text" : "Wrap text"}
              >
                {isTextWrapped ? (
                  <Scissors className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <WrapText className="h-3.5 w-3.5 text-primary" />
                )}
              </button>
            </div>
          </DropdownMenuItem>
        )}
        {resetPinnedColumns && pinnedColumns && pinnedColumns.length > 1 && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              resetPinnedColumns();
            }}
            className="py-2.5"
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center">
                <PinOff className="mr-2 h-4 w-4 text-muted-foreground" />
                Pinned columns
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  resetPinnedColumns();
                }}
                className="p-1 rounded-sm hover:bg-primary/10"
                title="Unpin all columns"
              >
                <PinOff className="h-3.5 w-3.5 text-primary" />
              </button>
            </div>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            resetColumnVisibility();
            resetPinnedColumns?.();
          }}
          className="py-2.5"
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center">
              <RotateCcw className="mr-2 h-4 w-4" />
              Column settings
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                resetColumnVisibility();
                resetPinnedColumns?.();
              }}
              className="p-1 rounded-sm hover:bg-primary/10"
              title="Reset all columns"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ColumnVisibilityDropdown };
