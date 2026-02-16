import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Menu,
  MenuCreate,
  MenuExportParams,
  MenuUpdate,
  MenuPage,
  MenuRightsBatch,
} from "@/types/central/menu";
import type { BaseListParams, PagedResponse } from "@/types/common";

export const menuService = {
  getMenus: async (
    params: BaseListParams = {}
  ): Promise<PagedResponse<Menu>> => {
    const formattedParams = {
      ...formatPaginationParams(params as Record<string, unknown>),
      sortBy: params.sortBy || "dblSeqNo",
    };
    return await ApiService.getWithMeta<PagedResponse<Menu>>(
      "/Menu",
      formattedParams
    );
  },

  getMenu: async (id: string): Promise<Menu> => {
    return await ApiService.get<Menu>(`/Menu/${id}`);
  },

  createMenu: async (menu: MenuCreate): Promise<Menu> => {
    return await ApiService.post<Menu>("/Menu", menu);
  },

  updateMenu: async (id: string, menu: MenuUpdate): Promise<Menu> => {
    return await ApiService.put<Menu>(`/Menu/${id}`, menu);
  },

  deleteMenu: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/Menu/${id}`);
    return true;
  },

  getParentMenus: async (menuGUID?: string): Promise<Menu[]> => {
    try {
      return await ApiService.get<Menu[]>(`/Menu/parent-menu`, {
        menuGUID,
      });
    } catch {
      return [];
    }
  },

  searchPages: async (search?: string): Promise<MenuPage[]> => {
    try {
      return await ApiService.get<MenuPage[]>(`/Menu/searchPages`, {
        search,
      });
    } catch {
      return [];
    }
  },

  exportMenus: async (params: MenuExportParams): Promise<Blob> => {
    return await ApiService.exportFile(
      "/Menu/export",
      { format: params.format },
      params.format
    );
  },

  updateBulkMenuRights: async (
    menuRights: MenuRightsBatch[],
    moduleGuid?: string,
    groupGuid?: string
  ): Promise<Menu[]> => {
    let url = `/Menu/bulkRights`;
    const queryParams = [];
    if (moduleGuid) queryParams.push(`moduleGuid=${moduleGuid}`);
    if (groupGuid) queryParams.push(`groupGuid=${groupGuid}`);

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }

    return await ApiService.post<Menu[]>(url, {
      Items: menuRights,
    });
  },
};
