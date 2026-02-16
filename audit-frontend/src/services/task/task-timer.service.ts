import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  TaskTimerFilterParams,
  TaskTimelineFilterDto,
  TaskTimelineResponse,
  TaskTimelineByUserParams,
  StartTimerRequest,
  StartTimerResponse,
  PauseTimerRequest,
  TimerActionRequest,
  ActiveSessionResponse,
  TaskActivityResponse,
} from "@/types/task/task-timer";

export type {
  StartTimerRequest,
  PauseTimerRequest,
  TimerActionRequest,
} from "@/types/task/task-timer";

export const taskTimerService = {
  getTaskTimersWithFilter: async (params: TaskTimerFilterParams) => {
    return await ApiService.get(
      `${TASK_API_PREFIX}/TaskTimer/filter`,
      params as unknown as Record<string, unknown>
    );
  },

  start: async (req: StartTimerRequest): Promise<StartTimerResponse> => {
    return await ApiService.post<StartTimerResponse>(
      `${TASK_API_PREFIX}/TaskTimer/start`,
      req
    );
  },

  resume: async (req: StartTimerRequest): Promise<StartTimerResponse> => {
    return await ApiService.post<StartTimerResponse>(
      `${TASK_API_PREFIX}/TaskTimer/start`,
      req
    );
  },

  onHold: async (req: PauseTimerRequest) => {
    return await ApiService.patch(`${TASK_API_PREFIX}/TaskTimer/on-hold`, req);
  },

  forReview: async (req: TimerActionRequest) => {
    return await ApiService.patch(
      `${TASK_API_PREFIX}/TaskTimer/for-review`,
      req
    );
  },

  incomplete: async (req: TimerActionRequest) => {
    return await ApiService.patch(
      `${TASK_API_PREFIX}/TaskTimer/incomplete`,
      req
    );
  },

  complete: async (req: TimerActionRequest) => {
    return await ApiService.patch(`${TASK_API_PREFIX}/TaskTimer/complete`, req);
  },

  getByTask: async (taskGUID: string) => {
    return await ApiService.get(`${TASK_API_PREFIX}/TaskTimer/${taskGUID}`);
  },

  getTaskActivity: async (taskGuid: string): Promise<TaskActivityResponse> => {
    return await ApiService.get<TaskActivityResponse>(
      `${TASK_API_PREFIX}/TaskTimer/activity/${taskGuid}`
    );
  },

  getActiveSession: async (): Promise<ActiveSessionResponse> => {
    return await ApiService.get<ActiveSessionResponse>(
      `${TASK_API_PREFIX}/TaskTimer/active/session`
    );
  },

  getTimeline: async (
    params: TaskTimelineFilterDto
  ): Promise<TaskTimelineResponse> => {
    return await ApiService.getWithMeta<TaskTimelineResponse>(
      `${TASK_API_PREFIX}/TaskTimer/timeline`,
      params as unknown as Record<string, unknown>
    );
  },

  getTimelineByUser: async (
    params: TaskTimelineByUserParams
  ): Promise<TaskTimelineResponse> => {
    return await ApiService.getWithMeta<TaskTimelineResponse>(
      `${TASK_API_PREFIX}/TaskTimer/timeline/by-user`,
      params as unknown as Record<string, unknown>
    );
  },

  exportTimelineToCsv: async (
    params: Omit<
      TaskTimelineByUserParams,
      "pageNumber" | "pageSize" | "sortBy" | "ascending"
    >
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/TaskTimer/timeline/by-user/export/csv`,
      params as unknown as Record<string, unknown>
    );
  },

  exportTimelineToPdf: async (
    params: Omit<
      TaskTimelineByUserParams,
      "pageNumber" | "pageSize" | "sortBy" | "ascending"
    >
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/TaskTimer/timeline/by-user/export/pdf`,
      params as unknown as Record<string, unknown>
    );
  },

  exportTimelineToExcel: async (
    params: Omit<
      TaskTimelineByUserParams,
      "pageNumber" | "pageSize" | "sortBy" | "ascending"
    >
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/TaskTimer/timeline/by-user/export/excel`,
      params as unknown as Record<string, unknown>
    );
  },
};

export const TaskTimerService = taskTimerService;
export default taskTimerService;
