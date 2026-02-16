import { useQuery } from "@tanstack/react-query";

import { createQueryKeys } from "@/hooks/api/common";
import type {
  DashboardStatusParams,
  BoardStatusParams,
  UserStatusParams,
} from "@/types/task/task-dashboard";
import { dashboardService } from "@/services/task/task-dashboard.service";

export const dashboardQueryKeys = createQueryKeys("dashboard");

export const useDashboardStatusUser = (params?: DashboardStatusParams) => {
  return useQuery({
    queryKey: dashboardQueryKeys.list(params || {}),
    queryFn: async () => {
      const response = await dashboardService.getStatusUser(params);
      return response.data || [];
    },
  });
};

export const useUserStatus = (
  params: UserStatusParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: dashboardQueryKeys.list({ type: "user-status", ...params }),
    queryFn: async () => {
      const response = await dashboardService.getUserStatus(params);
      return response.data || [];
    },
    enabled: enabled && !!params?.strBoardGUID && !!params?.strUserGUID,
  });
};

export const useBoardStatus = (
  params: BoardStatusParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: dashboardQueryKeys.list({
      type: "board-status",
      ...params,
    }),
    queryFn: async () => {
      const response = await dashboardService.getBoardStatus(params);
      return response.data || [];
    },
    enabled: enabled && !!params?.strBoardGUID,
  });
};
