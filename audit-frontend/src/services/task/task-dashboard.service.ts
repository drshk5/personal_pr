import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  DashboardStatusParams,
  BoardStatusParams,
  UserStatusParams,
  DashboardStatusUserResponse,
  DashboardUserStatusResponse,
  DashboardBoardStatusResponse,
} from "@/types/task/task-dashboard";

export const dashboardService = {
  getStatusUser: async (
    params: DashboardStatusParams = {}
  ): Promise<DashboardStatusUserResponse> => {
    return await ApiService.getWithMeta<DashboardStatusUserResponse>(
      `${TASK_API_PREFIX}/Dashboard/status-user`,
      params as Record<string, unknown>
    );
  },

  getUserStatus: async (
    params: UserStatusParams
  ): Promise<DashboardUserStatusResponse> => {
    return await ApiService.getWithMeta<DashboardUserStatusResponse>(
      `${TASK_API_PREFIX}/Dashboard/user-status`,
      params as unknown as Record<string, unknown>
    );
  },

  getBoardStatus: async (
    params: BoardStatusParams
  ): Promise<DashboardBoardStatusResponse> => {
    return await ApiService.getWithMeta<DashboardBoardStatusResponse>(
      `${TASK_API_PREFIX}/Dashboard/board-status`,
      params as unknown as Record<string, unknown>
    );
  },
};
