import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  Tag,
  TagCreate,
  TagParams,
  TagSimple,
  TagUpdate,
  TagListResponse,
} from "@/types/task/tag";

export const tagService = {
  getTags: async (params: TagParams = {}): Promise<TagListResponse> => {
    return await ApiService.getWithMeta<TagListResponse>(
      `${TASK_API_PREFIX}/Tag`,
      params as Record<string, unknown>
    );
  },

  getTag: async (id: string): Promise<Tag> => {
    return await ApiService.get<Tag>(`${TASK_API_PREFIX}/Tag/${id}`);
  },

  createTag: async (tag: TagCreate): Promise<TagSimple> => {
    return await ApiService.post<TagSimple>(`${TASK_API_PREFIX}/Tag`, tag);
  },

  updateTag: async (id: string, tag: TagUpdate): Promise<TagSimple> => {
    return await ApiService.put<TagSimple>(`${TASK_API_PREFIX}/Tag/${id}`, tag);
  },

  deleteTag: async (id: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(`${TASK_API_PREFIX}/Tag/${id}`);
  },
};
