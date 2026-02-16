import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Group,
  GroupExportParams,
  GroupListResponse,
} from "@/types/central/group";
import type { BaseListParams } from "@/types";

export const groupService = {
  getGroups: async (
    params: BaseListParams = {}
  ): Promise<GroupListResponse> => {
    return await ApiService.getWithMeta<GroupListResponse>(
      "/Group",
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strName",
      })
    );
  },

  getGroup: async (id: string): Promise<Group> => {
    return await ApiService.get<Group>(`/Group/${id}`);
  },

  createGroup: async (formData: FormData): Promise<Group> => {
    return await ApiService.post<Group>("/Group", formData);
  },

  updateGroup: async (id: string, formData: FormData): Promise<Group> => {
    return await ApiService.put<Group>(`/Group/${id}`, formData);
  },

  deleteGroup: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/Group/${id}`);
    return true;
  },

  exportGroups: async (params: GroupExportParams): Promise<Blob> => {
    return await ApiService.exportFile("/Group/export", {}, params.format);
  },
};
