import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  TaskViewPosition,
  TaskViewPositionCreate,
  TaskViewPositionListResponse,
  TaskViewPositionParams,
  TaskViewPositionUpdate,
  MoveTaskRequest,
  ReorderTasksRequest,
} from "@/types/task/task";

export const taskViewPositionService = {
  getTaskViewPositions: async (
    params: TaskViewPositionParams = {}
  ): Promise<TaskViewPositionListResponse> => {
    return await ApiService.getWithMeta<TaskViewPositionListResponse>(
      `${TASK_API_PREFIX}/TaskViewPosition`,
      params as Record<string, unknown>
    );
  },

  getTaskViewPosition: async (id: string): Promise<TaskViewPosition> => {
    return await ApiService.get<TaskViewPosition>(
      `${TASK_API_PREFIX}/TaskViewPosition/${id}`
    );
  },

  createTaskViewPosition: async (
    position: TaskViewPositionCreate
  ): Promise<TaskViewPosition> => {
    return await ApiService.post<TaskViewPosition>(
      `${TASK_API_PREFIX}/TaskViewPosition`,
      position
    );
  },

  updateTaskViewPosition: async (
    id: string,
    position: TaskViewPositionUpdate
  ): Promise<TaskViewPosition> => {
    return await ApiService.put<TaskViewPosition>(
      `${TASK_API_PREFIX}/TaskViewPosition/${id}`,
      position
    );
  },

  deleteTaskViewPosition: async (id: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/TaskViewPosition/${id}`
    );
  },

  moveTaskToSection: async (request: MoveTaskRequest): Promise<boolean> => {
    return await ApiService.post<boolean>(
      `${TASK_API_PREFIX}/TaskViewPosition/move-task`,
      request
    );
  },

  reorderTasksInSection: async (
    request: ReorderTasksRequest
  ): Promise<boolean> => {
    return await ApiService.post<boolean>(
      `${TASK_API_PREFIX}/TaskViewPosition/reorder-tasks`,
      request
    );
  },
};
