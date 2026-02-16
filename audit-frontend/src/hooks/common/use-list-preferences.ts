import { useState, useEffect, useMemo, useCallback } from "react";
export interface PaginationPreferences {
  pageNumber: number;
  pageSize: number;
  totalCount?: number;
  totalPages?: number;
  totalRecords?: number;
}

export interface SortingPreferences {
  columnKey: string | null;
  direction: "asc" | "desc";
}

export interface ListPreferences {
  pagination: PaginationPreferences;
  sorting: SortingPreferences;
}

const DEFAULT_PAGINATION: PaginationPreferences = {
  pageNumber: 1,
  pageSize: 10,
};

const DEFAULT_SORTING: SortingPreferences = {
  columnKey: null,
  direction: "asc",
};

export function useListPreferences(
  pageKey: string,
  initialValues?: {
    pagination?: Partial<PaginationPreferences>;
    sorting?: Partial<SortingPreferences>;
  }
) {
  const initialState = useMemo(
    () => ({
      pagination: {
        ...DEFAULT_PAGINATION,
        ...(initialValues?.pagination || {}),
      },
      sorting: {
        ...DEFAULT_SORTING,
        ...(initialValues?.sorting || {}),
      },
    }),
    [initialValues]
  );

  const [state, setState] = useState<ListPreferences>(() => {
    const savedPreferences = localStorage.getItem(
      `list_preferences_${pageKey}`
    );
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);

        if (parsed && typeof parsed === "object") {
          return {
            pagination: {
              ...initialState.pagination,
              ...(parsed.pagination && typeof parsed.pagination === "object"
                ? {
                    pageNumber: parsed.pagination.pageNumber,
                    pageSize: parsed.pagination.pageSize,
                    totalCount: initialState.pagination.totalCount,
                    totalRecords: initialState.pagination.totalRecords,
                    totalPages: initialState.pagination.totalPages,
                  }
                : {}),
            },
            sorting: {
              ...initialState.sorting,
              ...(parsed.sorting && typeof parsed.sorting === "object"
                ? parsed.sorting
                : {}),
            },
          };
        }
      } catch (e) {
        console.error("Failed to parse saved list preferences", e);
      }
    }

    return initialState;
  });

  useEffect(() => {
    const stateToSave = {
      pagination: {
        pageNumber: state.pagination.pageNumber,
        pageSize: state.pagination.pageSize,
      },
      sorting: state.sorting,
    };
    localStorage.setItem(
      `list_preferences_${pageKey}`,
      JSON.stringify(stateToSave)
    );
  }, [
    pageKey,
    state.pagination.pageNumber,
    state.pagination.pageSize,
    state.sorting,
  ]);

  const updateResponseData = useCallback(
    (data: {
      totalCount?: number;
      totalPages?: number;
      totalRecords?: number;
    }) => {
      if (
        data.totalCount === undefined &&
        data.totalPages === undefined &&
        data.totalRecords === undefined
      )
        return;

      setState((prev) => {
        const totalValue =
          data.totalRecords !== undefined ? data.totalRecords : data.totalCount;

        if (
          (totalValue !== undefined &&
            (totalValue !== prev.pagination.totalRecords ||
              totalValue !== prev.pagination.totalCount)) ||
          (data.totalPages !== undefined &&
            data.totalPages !== prev.pagination.totalPages)
        ) {
          return {
            ...prev,
            pagination: {
              ...prev.pagination,
              totalCount: totalValue ?? prev.pagination.totalCount,
              totalRecords: totalValue ?? prev.pagination.totalRecords,
              totalPages: data.totalPages ?? prev.pagination.totalPages,
            },
          };
        }
        return prev;
      });
    },
    []
  );

  const setPagination = (pagination: Partial<PaginationPreferences>) => {
    const { totalCount, totalPages, totalRecords, ...paginationData } =
      pagination;

    if (Object.keys(paginationData).length > 0) {
      setState((prev) => {
        const hasChanged = Object.keys(paginationData).some(
          (key) =>
            paginationData[key as keyof typeof paginationData] !==
            prev.pagination[key as keyof PaginationPreferences]
        );

        return hasChanged
          ? { ...prev, pagination: { ...prev.pagination, ...paginationData } }
          : prev;
      });
    }

    if (
      totalCount !== undefined ||
      totalPages !== undefined ||
      totalRecords !== undefined
    ) {
      updateResponseData({
        totalCount,
        totalPages,
        totalRecords,
      });
    }
  };

  const setSorting = (sorting: Partial<SortingPreferences>) => {
    setState((prev) => {
      const newSorting = { ...prev.sorting, ...sorting };
      const hasChanged = Object.keys(sorting).some(
        (key) =>
          sorting[key as keyof typeof sorting] !==
          prev.sorting[key as keyof SortingPreferences]
      );

      return hasChanged ? { ...prev, sorting: newSorting } : prev;
    });
  };

  const resetToDefaults = () => {
    setState(initialState);
    localStorage.removeItem(`list_preferences_${pageKey}`);
  };

  return {
    ...state,
    setPagination,
    setSorting,
    resetToDefaults,
    updateResponseData,
  };
}
