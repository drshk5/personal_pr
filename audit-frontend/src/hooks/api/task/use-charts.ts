import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { chartsService } from "@/services/task/charts.service";
import { createQueryKeys } from "@/hooks/api/common";
import type {
  ChartFilterRequest,
  LeaderboardItemDto,
  WorkloadHeatmapItemDto,
  RateCoverageItemDto,
  TaskAgingItemDto,
  TopTaskEffortItemDto,
  UserCompletionStatsDto,
} from "@/types/task/charts";

export const chartsQueryKeys = createQueryKeys("charts");

export const useUserLeaderboard = (
  params?: ChartFilterRequest,
  enabled: boolean = true,
  options?: Omit<UseQueryOptions<LeaderboardItemDto[]>, "queryKey" | "queryFn">
) => {
  return useQuery<LeaderboardItemDto[]>({
    queryKey: chartsQueryKeys.list({ type: "leaderboard", ...params }),
    queryFn: () =>
      chartsService.getUserLeaderboard(params as ChartFilterRequest),
    enabled: enabled && !!params?.strBoardGUID,
    ...options,
  });
};

export const useWorkloadHeatmap = (
  params?: ChartFilterRequest,
  enabled: boolean = true,
  options?: Omit<
    UseQueryOptions<WorkloadHeatmapItemDto[]>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<WorkloadHeatmapItemDto[]>({
    queryKey: chartsQueryKeys.list({ type: "workload-heatmap", ...params }),
    queryFn: () =>
      chartsService.getWorkloadHeatmap(params as ChartFilterRequest),
    enabled: enabled && !!params?.strBoardGUID,
    ...options,
  });
};

export const useRateCoverage = (
  params?: ChartFilterRequest,
  enabled: boolean = true,
  options?: Omit<UseQueryOptions<RateCoverageItemDto[]>, "queryKey" | "queryFn">
) => {
  return useQuery<RateCoverageItemDto[]>({
    queryKey: chartsQueryKeys.list({ type: "rate-coverage", ...params }),
    queryFn: () => chartsService.getRateCoverage(params as ChartFilterRequest),
    enabled: enabled && !!params?.strBoardGUID,
    ...options,
  });
};

export const useTaskAging = (
  params?: ChartFilterRequest,
  enabled: boolean = true,
  options?: Omit<UseQueryOptions<TaskAgingItemDto[]>, "queryKey" | "queryFn">
) => {
  return useQuery<TaskAgingItemDto[]>({
    queryKey: chartsQueryKeys.list({ type: "task-aging", ...params }),
    queryFn: () => chartsService.getTaskAging(params as ChartFilterRequest),
    enabled: enabled && !!params?.strBoardGUID,
    ...options,
  });
};

export const useTopTasksEffort = (
  params?: ChartFilterRequest,
  top: number = 10,
  enabled: boolean = true,
  options?: Omit<
    UseQueryOptions<TopTaskEffortItemDto[]>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<TopTaskEffortItemDto[]>({
    queryKey: chartsQueryKeys.list({
      type: "top-tasks-effort",
      top,
      ...params,
    }),
    queryFn: () =>
      chartsService.getTopTasksEffort(params as ChartFilterRequest, top),
    enabled: enabled && !!params?.strBoardGUID,
    ...options,
  });
};

export const useUserCompletionStats = (
  params?: ChartFilterRequest,
  enabled: boolean = true,
  options?: Omit<
    UseQueryOptions<UserCompletionStatsDto[]>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<UserCompletionStatsDto[]>({
    queryKey: chartsQueryKeys.list({
      type: "user-completion-stats",
      ...params,
    }),
    queryFn: () =>
      chartsService.getUserCompletionStats(params as ChartFilterRequest),
    enabled: enabled && !!params?.strBoardGUID,
    ...options,
  });
};
