import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  UserRole,
  UserRoleCreate,
  UserRoleListResponse,
  UserRoleParams,
  UserRoleUpdate,
} from "@/types/central/user-role";

export const userRoleService = {
  getUserRoles: async (
    params: UserRoleParams = {}
  ): Promise<UserRoleListResponse> => {
    return await ApiService.getWithMeta<UserRoleListResponse>(
      "/UserRole",
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strName",
      })
    );
  },

  getUserRole: async (id: string): Promise<UserRole> => {
    return await ApiService.get<UserRole>(`/UserRole/${id}`);
  },

  createUserRole: async (userRole: UserRoleCreate): Promise<UserRole> => {
    return await ApiService.post<UserRole>("/UserRole", userRole);
  },

  updateUserRole: async (
    id: string,
    userRole: UserRoleUpdate
  ): Promise<UserRole> => {
    return await ApiService.put<UserRole>(`/UserRole/${id}`, userRole);
  },

  deleteUserRole: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/UserRole/${id}`);
    return true;
  },

  getActiveRoles: async (search?: string): Promise<UserRole[]> => {
    return await ApiService.get<UserRole[]>("/UserRole/active", {
      search: search,
    });
  },

  exportUserRoles: async (params: {
    format: "excel" | "csv";
  }): Promise<Blob> => {
    return await ApiService.exportFile("/UserRole/export", {}, params.format);
  },
};
