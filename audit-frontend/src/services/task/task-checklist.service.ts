import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  TaskChecklist,
  TaskChecklistSimple,
  TaskChecklistCreate,
  TaskChecklistListResponse,
  TaskChecklistParams,
  TaskChecklistUpdate,
} from "@/types/task/checklist";

export const taskChecklistService = {
  getTaskChecklists: async (
    params: TaskChecklistParams = {}
  ): Promise<TaskChecklistListResponse> => {
    return await ApiService.getWithMeta<TaskChecklistListResponse>(
      `${TASK_API_PREFIX}/TaskChecklist`,
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getTaskChecklist: async (id: string): Promise<TaskChecklist> => {
    return await ApiService.get<TaskChecklist>(
      `${TASK_API_PREFIX}/TaskChecklist/${id}`
    );
  },

  createTaskChecklist: async (
    checklist: TaskChecklistCreate
  ): Promise<TaskChecklistSimple> => {
    return await ApiService.post<TaskChecklistSimple>(
      `${TASK_API_PREFIX}/TaskChecklist`,
      checklist
    );
  },

  updateTaskChecklist: async (
    id: string,
    checklist: TaskChecklistUpdate
  ): Promise<TaskChecklistSimple> => {
    return await ApiService.put<TaskChecklistSimple>(
      `${TASK_API_PREFIX}/TaskChecklist/${id}`,
      checklist
    );
  },

  deleteTaskChecklist: async (id: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/TaskChecklist/${id}`
    );
  },

  completeTaskChecklist: async (id: string): Promise<boolean> => {
    return await ApiService.post<boolean>(
      `${TASK_API_PREFIX}/TaskChecklist/${id}/complete`,
      {}
    );
  },

  uncompleteTaskChecklist: async (id: string): Promise<boolean> => {
    return await ApiService.post<boolean>(
      `${TASK_API_PREFIX}/TaskChecklist/${id}/uncomplete`,
      {}
    );
  },

  reorderTaskChecklists: async (
    taskId: string,
    checklistIds: string[]
  ): Promise<boolean> => {
    return await ApiService.post<boolean>(
      `${TASK_API_PREFIX}/TaskChecklist/${taskId}/reorder`,
      checklistIds
    );
  },
};
