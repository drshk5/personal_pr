export function formatPaginationParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const formattedParams: Record<string, unknown> = {
    pageNumber: params.pageNumber || 1,
    pageSize: params.pageSize || 10,
    search: params.search,
    sortBy: params.sortBy || undefined,
    ascending: params.ascending === undefined ? true : params.ascending,
    bolIsActive: params.bolIsActive,
  };

  // Join array GUID parameters with commas
  Object.keys(params).forEach((key) => {
    if (Array.isArray(params[key]) && key.toLowerCase().includes("guid")) {
      formattedParams[key] = (params[key] as unknown[]).join(",");
    } else if (!Object.keys(formattedParams).includes(key)) {
      formattedParams[key] = params[key];
    }
  });

  return formattedParams;
}

// Different from PagedResponse<T> in types/Central/common.ts (uses totalCount vs totalRecords)
export interface StandardPagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function mapToStandardPagedResponse<T>(
  apiData: unknown
): StandardPagedResponse<T> {
  // Case 1: Object with items/Items property
  if (
    typeof apiData === "object" &&
    apiData !== null &&
    ("items" in apiData || "Items" in apiData)
  ) {
    const data = apiData as Record<string, unknown>;

    return {
      items: (data.items || data.Items || []) as T[],
      totalCount: (data.totalCount ||
        data.TotalCount ||
        data.totalRecords ||
        0) as number,
      pageNumber: (data.pageNumber || data.PageNumber || 1) as number,
      pageSize: (data.pageSize || data.PageSize || 10) as number,
      totalPages: (data.totalPages || data.TotalPages || 0) as number,
      hasPreviousPage: (data.hasPreviousPage ||
        data.HasPrevious ||
        data.hasPreviousPage ||
        false) as boolean,
      hasNextPage: (data.hasNextPage ||
        data.HasNext ||
        data.hasNextPage ||
        false) as boolean,
    };
  }

  // Case 2: Array response
  if (Array.isArray(apiData)) {
    return {
      items: apiData as T[],
      totalCount: apiData.length,
      pageNumber: 1,
      pageSize: apiData.length,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }

  // Default empty response
  return {
    items: [] as T[],
    totalCount: 0,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}
