import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type { ApiResponse, BackendPagedResponse } from "@/types";
import type {
  Task,
  TaskCreate,
  TaskParams,
  MyTaskParams,
  MyTaskListItem,
  BoardTaskParams,
  TaskListItem,
  TaskUpdate,
  MoveTaskRequest,
  DuplicateTaskRequest,
  BulkTaskCreateRequest,
  BulkTaskCreateResponse,
} from "@/types/task/task";

export const taskService = {
  getTasks: async (params: TaskParams = {}): Promise<Task[]> => {
    const response = await ApiService.getWithMeta<BackendPagedResponse<Task[]>>(
      `${TASK_API_PREFIX}/Task`,
      params as Record<string, unknown>
    );
    return response.data;
  },

  getAllTasks: async (
    params: TaskParams = {}
  ): Promise<BackendPagedResponse<Task[]>> => {
    return await ApiService.getWithMeta<BackendPagedResponse<Task[]>>(
      `${TASK_API_PREFIX}/Task/all-tasks`,
      params as Record<string, unknown>
    );
  },

  getMyTasks: async (
    params: MyTaskParams = {}
  ): Promise<BackendPagedResponse<MyTaskListItem[]>> => {
    return await ApiService.getWithMeta<BackendPagedResponse<MyTaskListItem[]>>(
      `${TASK_API_PREFIX}/Task/my-task`,
      params as Record<string, unknown>
    );
  },

  getBoardTasks: async (
    params: BoardTaskParams
  ): Promise<BackendPagedResponse<TaskListItem[]>> => {
    return await ApiService.getWithMeta<BackendPagedResponse<TaskListItem[]>>(
      `${TASK_API_PREFIX}/Task/all-tasks/board-tasks`,
      params as unknown as Record<string, unknown>
    );
  },

  getTask: async (id: string): Promise<Task> => {
    const task = await ApiService.get<
      Task & { strSubModuleGUID?: string | null }
    >(`${TASK_API_PREFIX}/Task/${id}`);
    return {
      ...task,
      // Normalize legacy field name for sub-module selection in edit mode.
      strBoardSubModuleGUID:
        task.strBoardSubModuleGUID ?? task.strSubModuleGUID ?? null,
    };
  },

  createTask: async (task: TaskCreate, files?: File[]): Promise<Task> => {
    const formData = new FormData();
    formData.append("taskData", JSON.stringify(task));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    const response = await api.post<ApiResponse<Task>>(
      `${TASK_API_PREFIX}/Task`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  updateTask: async (
    id: string,
    task: TaskUpdate,
    files?: File[],
    strRemoveDocumentAssociationGUIDs?: string[]
  ): Promise<Task> => {
    const formData = new FormData();
    formData.append("taskData", JSON.stringify(task));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    if (
      strRemoveDocumentAssociationGUIDs &&
      strRemoveDocumentAssociationGUIDs.length > 0
    ) {
      strRemoveDocumentAssociationGUIDs.forEach((guid) =>
        formData.append("strRemoveDocumentAssociationGUIDs", guid)
      );
    }

    const response = await api.put<ApiResponse<Task>>(
      `${TASK_API_PREFIX}/Task/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  deleteTask: async (id: string): Promise<boolean> => {
    const response = await ApiService.deleteWithMeta<ApiResponse<boolean>>(
      `${TASK_API_PREFIX}/Task/${id}`
    );
    return response.data;
  },

  moveTask: async (
    taskGuid: string,
    request: MoveTaskRequest
  ): Promise<boolean> => {
    const response = await ApiService.postWithMeta<ApiResponse<boolean>>(
      `${TASK_API_PREFIX}/Task/${taskGuid}/move-task`,
      request
    );
    return response.data;
  },

  duplicateTask: async (
    taskGuid: string,
    request: DuplicateTaskRequest
  ): Promise<Task> => {
    const response = await ApiService.postWithMeta<ApiResponse<Task>>(
      `${TASK_API_PREFIX}/Task/${taskGuid}/duplicate-task`,
      request
    );
    return response.data;
  },

  bulkCreateTasks: async (
    request: BulkTaskCreateRequest
  ): Promise<BulkTaskCreateResponse> => {
    const response = await ApiService.postWithMeta<
      ApiResponse<BulkTaskCreateResponse>
    >(`${TASK_API_PREFIX}/Task/bulk-create`, request);
    return response.data;
  },
};

export const TaskService = taskService;
