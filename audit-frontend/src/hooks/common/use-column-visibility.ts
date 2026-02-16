import { useState, useEffect } from "react";

export interface ColumnVisibilityState {
  [key: string]: boolean;
}

export function useColumnVisibility(
  tableId: string,
  initialState: ColumnVisibilityState,
  alwaysVisibleColumns: string[] = []
) {
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>(() => {
      try {
        const savedVisibility = localStorage.getItem(
          `column_visibility_${tableId}`
        );
        if (savedVisibility) {
          const parsed = JSON.parse(savedVisibility);

          const mergedVisibility = { ...parsed };
          for (const col of alwaysVisibleColumns) {
            mergedVisibility[col] = true;
          }
          return mergedVisibility;
        }
      } catch (error) {
        console.error(
          "Failed to load column visibility from localStorage:",
          error
        );
      }

      return initialState;
    });

  const [isTextWrapped, setIsTextWrapped] = useState<boolean>(() => {
    try {
      const savedTextWrapState = localStorage.getItem(`text_wrap_${tableId}`);
      if (savedTextWrapState !== null) {
        return JSON.parse(savedTextWrapState);
      }
    } catch (error) {
      console.error("Failed to load text wrap state from localStorage:", error);
    }

    return false;
  });

  const [pinnedColumns, setPinnedColumns] = useState<string[]>(() => {
    try {
      const savedPinnedColumns = localStorage.getItem(
        `pinned_columns_${tableId}`
      );
      if (savedPinnedColumns !== null) {
        const savedPins = JSON.parse(savedPinnedColumns);

        if (!savedPins.includes("actions")) {
          return ["actions"];
        }

        return savedPins;
      }
    } catch (error) {
      console.error("Failed to load pinned columns from localStorage:", error);
    }

    return ["actions"];
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        `column_visibility_${tableId}`,
        JSON.stringify(columnVisibility)
      );
    } catch (error) {
      console.error("Failed to save column visibility to localStorage:", error);
    }
  }, [tableId, columnVisibility]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `text_wrap_${tableId}`,
        JSON.stringify(isTextWrapped)
      );
    } catch (error) {
      console.error("Failed to save text wrap state to localStorage:", error);
    }
  }, [tableId, isTextWrapped]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `pinned_columns_${tableId}`,
        JSON.stringify(pinnedColumns)
      );
    } catch (error) {
      console.error("Failed to save pinned columns to localStorage:", error);
    }
  }, [tableId, pinnedColumns]);

  const toggleColumnVisibility = (columnKey: string) => {
    if (columnKey === "actions" || alwaysVisibleColumns.includes(columnKey)) {
      return;
    }

    setColumnVisibility((prev) => {
      const currentValue = prev[columnKey];
      const newValue = currentValue === false ? true : false;

      if (!newValue) {
        setPinnedColumns((current) =>
          current.filter((col) => col !== columnKey)
        );
      }

      return {
        ...prev,
        [columnKey]: newValue,
      };
    });
  };

  const resetColumnVisibility = () => {
    setColumnVisibility(initialState);
    try {
      localStorage.removeItem(`column_visibility_${tableId}`);
    } catch (error) {
      console.error(
        "Failed to remove column visibility from localStorage:",
        error
      );
    }
  };

  const hasVisibleContentColumns = () => {
    return Object.entries(columnVisibility).some(
      ([key, isVisible]) =>
        key !== "actions" && !alwaysVisibleColumns.includes(key) && isVisible
    );
  };

  const getAlwaysVisibleColumns = () => {
    return ["actions", ...alwaysVisibleColumns];
  };

  const toggleTextWrapping = () => {
    setIsTextWrapped((prevState) => !prevState);
  };

  const countUserPinnedColumns = (columns: string[]) => {
    return columns.filter((col) => col !== "actions").length;
  };

  const pinColumn = (columnKey: string) => {
    setPinnedColumns((prev) => {
      if (prev.includes(columnKey)) {
        return prev;
      }

      if (columnKey === "actions") {
        return prev;
      }

      if (countUserPinnedColumns(prev) >= 2) {
        return prev;
      }

      return [...prev, columnKey];
    });
  };

  const unpinColumn = (columnKey: string) => {
    if (columnKey === "actions") return;

    setPinnedColumns((prev) => prev.filter((col) => col !== columnKey));
  };

  const resetPinnedColumns = () => {
    setPinnedColumns(["actions"]);
    try {
      localStorage.setItem(
        `pinned_columns_${tableId}`,
        JSON.stringify(["actions"])
      );
    } catch (error) {
      console.error("Failed to reset pinned columns in localStorage:", error);
    }
  };

  return {
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
  };
}
