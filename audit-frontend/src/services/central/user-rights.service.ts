import { ApiService } from "@/lib/api/api-service";
import type {
  MenuItem,
  UserRightsBatchRequest,
  UserRightsBatchResponse,
  UserRightsListResponse,
  UserRightsParams,
  MenuTree,
  UserRight,
  MenuUserRightsTree,
  MenuItemInternal,
  UserRightsTreeResponse,
} from "@/types/central/user-rights";
import type { ApiResponse } from "@/types/common";

let menuItemsCache: MenuItemInternal[] | null = null;

const getMenuItems = async (): Promise<MenuItemInternal[]> => {
  if (menuItemsCache) {
    return menuItemsCache;
  }

  const items = await ApiService.getArray<MenuItemInternal>("/Menu");
  menuItemsCache = items;
  return menuItemsCache;
};

interface UserRightsServiceType {
  fixMenuPositions: (menuItems: MenuItem[]) => MenuItem[];
  getUserMenuRights: (
    _unusedOrganizationId?: string,
    additionalParams?: Record<string, string | number | boolean>
  ) => Promise<{ data: MenuItem[] }>;
  getUserRights: (params?: UserRightsParams) => Promise<UserRightsListResponse>;
  getUserRightsByRole: () => Promise<ApiResponse<MenuTree[]>>;
  batchUpsertUserRights: (
    userRights: UserRightsBatchRequest
  ) => Promise<UserRightsBatchResponse>;
  getUserRightsTree: (
    params?: UserRightsParams
  ) => Promise<UserRightsTreeResponse>;
}

export const UserRightsService: UserRightsServiceType = {
  fixMenuPositions: (menuItems: MenuItem[]): MenuItem[] => {
    if (!menuItems || menuItems.length === 0) return [];

    const sidebarItems = menuItems.filter(
      (item) => item.strMenuPosition === "sidebar"
    );
    const userbarItems = menuItems.filter(
      (item) => item.strMenuPosition === "userbar"
    );

    if (sidebarItems.length === 0 || userbarItems.length === 0) {
      return menuItems.map((item) => {
        const newItem = { ...item };

        if (
          ["sidebar", "userbar", "hidden"].includes(
            newItem.strMenuPosition || ""
          )
        ) {
          return newItem;
        }

        if (
          !newItem.strPath.includes(":") &&
          !newItem.strPath.includes("form") &&
          newItem.permission.bolCanView
        ) {
          if (
            newItem.strPath.toLowerCase().includes("user") ||
            newItem.strName.toLowerCase().includes("user") ||
            newItem.strIconName?.toLowerCase().includes("user") ||
            newItem.strPath.toLowerCase().includes("role") ||
            newItem.strName.toLowerCase().includes("role") ||
            newItem.strMapKey?.toLowerCase().includes("user") ||
            newItem.strMapKey?.toLowerCase().includes("role")
          ) {
            newItem.strMenuPosition = "userbar";
          } else if (
            !newItem.strPath.includes("/") ||
            newItem.strPath.split("/").length <= 2
          ) {
            newItem.strMenuPosition = "sidebar";
          }
        }

        return newItem;
      });
    }

    return menuItems;
  },

  getUserMenuRights: async (
    _unusedOrganizationId?: string,
    additionalParams?: Record<string, string | number | boolean>
  ) => {
    const response = await ApiService.get<MenuItem[]>("/UserRights/role", {
      ...additionalParams,
    });

    const menuItems = UserRightsService.fixMenuPositions(response);
    return { data: menuItems };
  },

  getUserRights: async (params: UserRightsParams = {}) => {
    if (!params.strRoleGUID) {
      return {
        statusCode: 200,
        message: "No role selected",
        data: {
          items: [],
          totalCount: 0,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
        },
      };
    }

    const responseData = await ApiService.getWithMeta<{
      statusCode?: number;
      statuscode?: number;
      message?: string;
      data?: {
        items?: UserRight[];
        Items?: UserRight[];
        totalCount?: number;
        TotalCount?: number;
        pageNumber?: number;
        PageNumber?: number;
        pageSize?: number;
        PageSize?: number;
        totalPages?: number;
        TotalPages?: number;
        hasPrevious?: boolean;
        HasPrevious?: boolean;
        hasNext?: boolean;
        HasNext?: boolean;
      };
    }>("/UserRights", {
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || 10,
      search: params.search,
      sortBy: params.sortBy,
      ascending: params.ascending === undefined ? true : params.ascending,
      strRoleGUID: params.strRoleGUID,
    });

    if (responseData?.data && typeof responseData.data === "object") {
      const items = responseData.data.items || responseData.data.Items || [];
      const menuItems = await getMenuItems();

      const enhancedItems = items.map((item: UserRight) => {
        const menuItem = menuItems.find(
          (menu) => menu.strGUID === item.strMenuGUID
        );
        return {
          ...item,
          menuName:
            item.menuName ||
            (menuItem ? menuItem.strName : "PickListType Form"),
        };
      });

      const normalizedData = {
        items: enhancedItems,
        totalCount:
          responseData.data.totalCount || responseData.data.TotalCount || 0,
        pageNumber:
          responseData.data.pageNumber || responseData.data.PageNumber || 1,
        pageSize:
          responseData.data.pageSize || responseData.data.PageSize || 10,
        totalPages:
          responseData.data.totalPages || responseData.data.TotalPages || 0,
        hasPrevious:
          responseData.data.hasPrevious ||
          responseData.data.HasPrevious ||
          false,
        hasNext:
          responseData.data.hasNext || responseData.data.HasNext || false,
      };

      return {
        statusCode: responseData.statusCode || responseData.statuscode || 200,
        message: responseData.message || "User rights retrieved successfully",
        data: normalizedData,
      };
    }

    return {
      statusCode: responseData.statusCode || responseData.statuscode || 200,
      message: responseData.message || "User rights retrieved successfully",
      data: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      },
    };
  },

  getUserRightsByRole: async () => {
    const responseData = await ApiService.getWithMeta<{
      statusCode?: number;
      message?: string;
      data?: MenuTree[];
    }>("/UserRights/role");

    return {
      statusCode: responseData.statusCode || 200,
      message: responseData.message || "Menu tree retrieved successfully",
      data: responseData.data || [],
    };
  },

  batchUpsertUserRights: async (userRights: UserRightsBatchRequest) => {
    const processedUserRights = userRights.userRights.map((right) => {
      if (right.strUserRightGUID === "") {
        return {
          ...right,
          strUserRightGUID: null,
        };
      }
      return right;
    });

    const requestBody = {
      UserRights: processedUserRights,
    };

    return await ApiService.post<UserRightsBatchResponse>(
      "/UserRights/batch",
      requestBody
    );
  },

  getUserRightsTree: async (params: UserRightsParams = {}) => {
    const responseData = await ApiService.getWithMeta<{
      statusCode?: number;
      message?: string;
      data?: {
        Items?: Record<string, MenuUserRightsTree[]>;
        TotalCount?: number;
        PageNumber?: number;
        PageSize?: number;
        TotalPages?: number;
        HasPrevious?: boolean;
        HasNext?: boolean;
      };
    }>("/UserRights/tree", {
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || 10,
      search: params.search,
      sortBy: params.sortBy,
      ascending: params.ascending === undefined ? true : params.ascending,
      strRoleGUID: params.strRoleGUID,
    });

    let flattenedItems: MenuUserRightsTree[] = [];
    if (
      responseData.data?.Items &&
      typeof responseData.data.Items === "object"
    ) {
      Object.entries(responseData.data.Items).forEach(
        ([category, categoryItems]) => {
          if (Array.isArray(categoryItems)) {
            const itemsWithCategory = categoryItems.map((item) => ({
              ...item,
              strCategory: item.strCategory || category,
            }));
            flattenedItems = [...flattenedItems, ...itemsWithCategory];
          }
        }
      );
    }

    return {
      statusCode: responseData.statusCode || 200,
      message:
        responseData.message || "Menu user rights tree retrieved successfully",
      data: {
        items: flattenedItems,
        totalCount: responseData.data?.TotalCount || flattenedItems.length,
        pageNumber: responseData.data?.PageNumber || 1,
        pageSize: responseData.data?.PageSize || 10,
        totalPages: responseData.data?.TotalPages || 0,
        hasPrevious: responseData.data?.HasPrevious || false,
        hasNext: responseData.data?.HasNext || false,
      },
    };
  },
};
