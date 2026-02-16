import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { api } from "@/lib/api/axios";
import type { ApiResponse, BaseListParams } from "@/types/common";
import type {
  Module,
  ModuleCreate,
  ModuleExportParams,
  ModuleListResponse,
  ModuleSelectionRequest,
  ModuleSelectionResponse,
  ModuleSimple,
  ModuleUpdate,
  UserModuleResponse,
} from "@/types/central/module";

export const moduleService = {
  switchModule: async (moduleId: string): Promise<ModuleSelectionResponse> => {
    const data: ModuleSelectionRequest = {
      strModuleGUID: moduleId,
    };

    const response = await api.post<ModuleSelectionResponse>(
      "/UserRights/switch-module",
      data
    );

    const token = response.data?.data?.token;

    if (token) {
      localStorage.setItem("Token", token);

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return response.data;
  },

  getModules: async (
    params: BaseListParams = {}
  ): Promise<ModuleListResponse> => {
    return await ApiService.getWithMeta<ModuleListResponse>(
      "/Module",
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strName",
      })
    );
  },

  getModule: async (id: string): Promise<Module> => {
    return await ApiService.get<Module>(`/Module/${id}`);
  },

  createModule: async (module: ModuleCreate): Promise<Module> => {
    const formData = new FormData();

    Object.entries(module).forEach(([key, value]) => {
      if (key === "ImageFile" && value instanceof File) {
        formData.append("ImageFile", value);
      } else if (typeof value === "boolean") {
        formData.append(key, value.toString());
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    const response = await api.post<ApiResponse<Module>>("/Module", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  updateModule: async (id: string, module: ModuleUpdate): Promise<Module> => {
    const formData = new FormData();

    Object.entries(module).forEach(([key, value]) => {
      if (key === "ImageFile" && value instanceof File) {
        formData.append("ImageFile", value);
      } else if (typeof value === "boolean") {
        formData.append(key, value.toString());
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    const response = await api.put<ApiResponse<Module>>(
      `/Module/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  getActiveModules: async (search?: string): Promise<ModuleSimple[]> => {
    return await ApiService.get<ModuleSimple[]>("/Module/active", {
      search: search,
    });
  },

  deleteModule: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/Module/${id}`);
    return true;
  },

  exportModules: async (params: ModuleExportParams): Promise<Blob> => {
    return await ApiService.exportFile("/Module/export", {}, params.format);
  },

  getUserModules: async (): Promise<UserModuleResponse> => {
    return await ApiService.getWithMeta<UserModuleResponse>(
      "/UserRights/user-module"
    );
  },
};
