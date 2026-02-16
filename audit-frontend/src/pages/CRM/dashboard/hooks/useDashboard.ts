import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "@/services/CRM/dashboard.service";
import { toast } from "sonner";
import type { DashboardData, PerformanceMetrics } from "@/types/crm/dashboard.types";

export const DASHBOARD_QUERY_KEY = ["crm", "dashboard"];

export function useDashboard() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: dashboardService.getDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const refreshMutation = useMutation({
    mutationFn: dashboardService.refreshDashboard,
    onSuccess: (result) => {
      queryClient.setQueryData(DASHBOARD_QUERY_KEY, result);
      toast.success("Dashboard refreshed successfully", {
        description: `Response time: ${result.performance.responseTimeMs.toFixed(0)}ms`,
      });
    },
    onError: (error: any) => {
      toast.error("Failed to refresh dashboard", {
        description: error.message || "Please try again later",
      });
    },
  });

  const invalidateCacheMutation = useMutation({
    mutationFn: dashboardService.invalidateCache,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      toast.success("Cache invalidated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to invalidate cache", {
        description: error.message || "Please try again later",
      });
    },
  });

  return {
    dashboard: data?.data,
    performance: data?.performance,
    isLoading,
    error,
    refetch,
    refresh: () => refreshMutation.mutate(),
    isRefreshing: refreshMutation.isPending,
    invalidateCache: () => invalidateCacheMutation.mutate(),
    isInvalidating: invalidateCacheMutation.isPending,
  };
}
