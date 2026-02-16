import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  User,
  UserCreate,
  UserUpdate,
  UserParams,
  UserByOrgModuleParams,
  UserListResponse,
  UserByOrgModuleResponse,
} from "@/types/central/user";
import type { ApiResponse } from "@/types/common";

export const userService = {
  getUsers: async (params: UserParams = {}): Promise<UserListResponse> => {
    return await ApiService.getWithMeta<UserListResponse>(
      "/User",
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strName",
      } as Record<string, unknown>)
    );
  },

  getUser: async (id: string): Promise<User> => {
    return await ApiService.get<User>(`/User/${id}`);
  },

  createUser: async (user: UserCreate): Promise<User> => {
    const formData = new FormData();

    Object.entries(user).forEach(([key, value]) => {
      if (key === "ProfileImgFile" && value instanceof File) {
        formData.append("ProfileImgFile", value);
      } else if (typeof value === "boolean") {
        formData.append(key, value.toString());
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    const response = await api.post<ApiResponse<User>>("/User", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  updateUser: async (id: string, user: UserUpdate): Promise<User> => {
    const formData = new FormData();

    Object.entries(user).forEach(([key, value]) => {
      if (key === "ProfileImgFile" && value instanceof File) {
        formData.append("ProfileImgFile", value);
      } else if (key === "RemoveProfileImage" && typeof value === "boolean") {
        formData.append("RemoveProfileImage", value.toString());
      } else if (typeof value === "boolean") {
        formData.append(key, value.toString());
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    const response = await api.put<ApiResponse<User>>(`/User/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  updateUserPassword: async (
    id: string,
    request: UserUpdate
  ): Promise<void> => {
    await ApiService.post<void>(`/User/${id}/update-password`, request);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/User/${id}`);
    return true;
  },

  updateProfile: async (data: UserUpdate) => {
    const queryClient = window.__QUERY_CLIENT__;
    const cachedUser = queryClient?.getQueryData(["auth", "user"]);

    let userId;

    if (
      cachedUser &&
      typeof cachedUser === "object" &&
      "strUserGUID" in cachedUser
    ) {
      userId = cachedUser.strUserGUID;
    } else {
      const currentUser = await ApiService.get<{
        strUserGUID: string;
        [key: string]: unknown;
      }>("/auth/me");
      userId = currentUser.strUserGUID;
    }

    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === "ProfileImgFile" && value instanceof File) {
        formData.append("ProfileImgFile", value);
      } else if (key === "RemoveProfileImage" && typeof value === "boolean") {
        formData.append("RemoveProfileImage", value.toString());
      } else if (typeof value === "boolean") {
        formData.append(key, value.toString());
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    const response = await api.put<ApiResponse<User>>(
      `/User/${userId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    return await ApiService.putWithMeta("/Auth/change-password", {
      currentPassword,
      newPassword,
    });
  },

  exportUsers: async (params: { format: "excel" | "csv" }): Promise<Blob> => {
    return await ApiService.exportFile("/User/export", {}, params.format);
  },

  getActiveUsers: async (search?: string) => {
    const response = await ApiService.get<
      { value: string; label: string; email: string }[]
    >("/User/active-users", {
      search,
    });
    return (response || []).map((item) => ({
      strUserGUID: item.value,
      strName: item.label,
      strEmailId: item.email,
    }));
  },

  getModuleUsers: async (bolIsActive?: boolean, search?: string) => {
    const params: Record<string, string | boolean> = {};
    if (bolIsActive !== undefined) {
      params.bolIsActive = bolIsActive;
    }
    if (search !== undefined && search.trim() !== "") {
      params.search = search;
    }

    const response = await ApiService.get<
      {
        strUserGUID: string;
        strName: string;
        strEmailId: string;
        bolIsActive: boolean;
        strProfileImg?: string | null;
      }[]
    >("/User/module-users", params);

    return (response || []).map((item) => ({
      strUserGUID: item.strUserGUID,
      strName: item.strName,
      strEmailId: item.strEmailId,
      bolIsActive: item.bolIsActive,
      strProfileImg: item.strProfileImg || null,
    }));
  },

  getUsersByOrganizationModule: async (
    params: UserByOrgModuleParams = {}
  ): Promise<UserByOrgModuleResponse> => {
    return await ApiService.getWithMeta<UserByOrgModuleResponse>(
      "/User/by-organization-module",
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strName",
      } as Record<string, unknown>)
    );
  },
};
