import { useState, useEffect } from "react";
import {
  useColumnVisibility,
  type ColumnVisibilityState,
} from "./use-column-visibility";

export interface TableLayoutState {
  columnOrder: string[];
  columnWidths: { [key: string]: number };
}

export function useTableLayout(
  tableId: string,
  defaultColumnOrder: string[],
  alwaysVisibleColumns: string[] = [],
  initialColumnVisibility: ColumnVisibilityState = {}
) {
  // Get column visibility state from existing hook
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
  } = useColumnVisibility(
    tableId,
    initialColumnVisibility,
    alwaysVisibleColumns
  );

  // Manage column order
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${tableId}_column_order`);
      return saved ? JSON.parse(saved) : defaultColumnOrder;
    } catch (error) {
      console.error("Failed to load column order from localStorage:", error);
      return defaultColumnOrder;
    }
  });

  // Manage column widths
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(
    () => {
      try {
        const saved = localStorage.getItem(`${tableId}_column_widths`);
        return saved ? JSON.parse(saved) : {};
      } catch (error) {
        console.error("Failed to load column widths from localStorage:", error);
        return {};
      }
    }
  );

  // Persist column order to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        `${tableId}_column_order`,
        JSON.stringify(columnOrder)
      );
    } catch (error) {
      console.error("Failed to save column order to localStorage:", error);
    }
  }, [tableId, columnOrder]);

  // Persist column widths to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        `${tableId}_column_widths`,
        JSON.stringify(columnWidths)
      );
    } catch (error) {
      console.error("Failed to save column widths to localStorage:", error);
    }
  }, [tableId, columnWidths]);

  // Reset all layout settings to defaults
  const resetAll = () => {
    resetColumnVisibility();
    setColumnOrder(defaultColumnOrder);
    setColumnWidths({});
    resetPinnedColumns();
  };

  return {
    // Visibility management
    columnVisibility,
    toggleColumnVisibility,
    resetColumnVisibility,
    hasVisibleContentColumns,
    getAlwaysVisibleColumns,
    // Text wrapping
    isTextWrapped,
    toggleTextWrapping,
    // Pinned columns
    pinnedColumns,
    pinColumn,
    unpinColumn,
    resetPinnedColumns,
    // Column order
    columnOrder,
    setColumnOrder,
    // Column widths
    columnWidths,
    setColumnWidths,
    // Reset all
    resetAll,
  };
}
