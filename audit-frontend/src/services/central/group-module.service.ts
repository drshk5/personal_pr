import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  GroupModule,
  GroupModuleCreate,
  GroupModuleListResponse,
  GroupModuleParams,
  GroupModuleSimpleListResponse,
  GroupModuleUpdate,
  ModuleInfo,
} from "@/types/central/group-module";

export const groupModuleService = {
  getGroupModules: async (
    params: GroupModuleParams
  ): Promise<GroupModuleListResponse> => {
    return await ApiService.getWithMeta<GroupModuleListResponse>(
      "/GroupModule",
      formatPaginationParams({
        ...params,
      })
    );
  },

  getGroupModulesByGroup: async (
    groupId: string,
    params: Omit<GroupModuleParams, "strGroupGUID"> = {}
  ): Promise<GroupModuleSimpleListResponse> => {
    return await ApiService.getWithMeta<GroupModuleSimpleListResponse>(
      `/GroupModule/group/${groupId}`,
      formatPaginationParams({
        ...params,
      })
    );
  },

  getGroupModule: async (id: string): Promise<GroupModule> => {
    return await ApiService.get<GroupModule>(`/GroupModule/${id}`);
  },

  createGroupModule: async (
    groupModule: GroupModuleCreate
  ): Promise<GroupModule> => {
    return await ApiService.post<GroupModule>("/GroupModule", groupModule);
  },

  updateGroupModule: async (
    id: string,
    groupModule: GroupModuleUpdate
  ): Promise<GroupModule> => {
    return await ApiService.put<GroupModule>(`/GroupModule/${id}`, groupModule);
  },

  deleteGroupModule: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/GroupModule/${id}`);
    return true;
  },

  getModulesByGroup: async (groupId: string): Promise<ModuleInfo[]> => {
    const response = await ApiService.get<ModuleInfo[]>(
      `/GroupModule/group/${groupId}/modules`
    );
    return Array.isArray(response) ? response : [];
  },
};
