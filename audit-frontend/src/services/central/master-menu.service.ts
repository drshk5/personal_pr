import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  MasterMenu,
  MasterMenuCreate,
  MasterMenuExportParams,
  MasterMenuParams,
  MasterMenuUpdate,
  MasterMenuParent,
  MasterMenuGroupModule,
  MenusByGroupModuleParams,
  MasterMenuListResponse,
} from "@/types/central/master-menu";

export const masterMenuService = {
  getMasterMenus: async (
    params: MasterMenuParams = {}
  ): Promise<MasterMenuListResponse> => {
    return await ApiService.getWithMeta<MasterMenuListResponse>(
      "/MasterMenu",
      formatPaginationParams({
        ...params,
      })
    );
  },

  getMasterMenu: async (id: string): Promise<MasterMenu> => {
    return await ApiService.get<MasterMenu>(`/MasterMenu/${id}`);
  },

  createMasterMenu: async (
    masterMenu: MasterMenuCreate
  ): Promise<MasterMenu> => {
    return await ApiService.post<MasterMenu>("/MasterMenu", masterMenu);
  },

  updateMasterMenu: async (
    id: string,
    masterMenu: MasterMenuUpdate
  ): Promise<MasterMenu> => {
    return await ApiService.put<MasterMenu>(`/MasterMenu/${id}`, masterMenu);
  },

  deleteMasterMenu: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/MasterMenu/${id}`);
    return true;
  },

  getParentMasterMenus: async (
    strMasterMenuGUID?: string,
    search?: string
  ): Promise<MasterMenuParent[]> => {
    const effectiveMenuGUID =
      strMasterMenuGUID || "00000000-0000-0000-0000-000000000000";

    return await ApiService.get<MasterMenuParent[]>(`/MasterMenu/parent-menu`, {
      strMasterMenuGUID: effectiveMenuGUID,
      search,
    });
  },

  getMenuCategories: async (
    search?: string
  ): Promise<{ value: string; label: string }[]> => {
    return await ApiService.get<{ value: string; label: string }[]>(
      `/MasterMenu/categories`,
      {
        search,
      }
    );
  },

  exportMasterMenus: async (params: MasterMenuExportParams): Promise<Blob> => {
    const { api } = await import("@/lib/api/axios");
    const response = await api.get("/MasterMenu/export", {
      params: {
        format: params.format,
      },
      responseType: "blob",
    });
    return response.data;
  },

  getMenusByGroupAndModule: async (
    params: MenusByGroupModuleParams
  ): Promise<MasterMenuGroupModule> => {
    return await ApiService.getWithMeta<MasterMenuGroupModule>(
      `/MasterMenu/by-group-module`,
      { ...params }
    );
  },
};
