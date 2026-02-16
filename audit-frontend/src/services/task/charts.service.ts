import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  ChartFilterRequest,
  LeaderboardItemDto,
  WorkloadHeatmapItemDto,
  RateCoverageItemDto,
  TaskAgingItemDto,
  TopTaskEffortItemDto,
  UserCompletionStatsDto,
} from "@/types/task/charts";

export const chartsService = {
  getUserLeaderboard: async (
    params: ChartFilterRequest
  ): Promise<LeaderboardItemDto[]> => {
    return await ApiService.get<LeaderboardItemDto[]>(
      `${TASK_API_PREFIX}/Charts/user-leaderboard`,
      params as unknown as Record<string, unknown>
    );
  },

  getWorkloadHeatmap: async (
    params: ChartFilterRequest
  ): Promise<WorkloadHeatmapItemDto[]> => {
    return await ApiService.get<WorkloadHeatmapItemDto[]>(
      `${TASK_API_PREFIX}/Charts/workload-heatmap`,
      params as unknown as Record<string, unknown>
    );
  },

  getRateCoverage: async (
    params: ChartFilterRequest
  ): Promise<RateCoverageItemDto[]> => {
    return await ApiService.get<RateCoverageItemDto[]>(
      `${TASK_API_PREFIX}/Charts/rate-coverage`,
      params as unknown as Record<string, unknown>
    );
  },

  getTaskAging: async (
    params: ChartFilterRequest
  ): Promise<TaskAgingItemDto[]> => {
    return await ApiService.get<TaskAgingItemDto[]>(
      `${TASK_API_PREFIX}/Charts/task-aging`,
      params as unknown as Record<string, unknown>
    );
  },

  getTopTasksEffort: async (
    params: ChartFilterRequest,
    top: number = 10
  ): Promise<TopTaskEffortItemDto[]> => {
    return await ApiService.get<TopTaskEffortItemDto[]>(
      `${TASK_API_PREFIX}/Charts/top-tasks-effort`,
      { ...params, top } as unknown as Record<string, unknown>
    );
  },

  getUserCompletionStats: async (
    params: ChartFilterRequest
  ): Promise<UserCompletionStatsDto[]> => {
    return await ApiService.get<UserCompletionStatsDto[]>(
      `${TASK_API_PREFIX}/Charts/user-completion-stats`,
      params as unknown as Record<string, unknown>
    );
  },
};
