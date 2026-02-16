import { ApiService } from "@/lib/api/api-service";
import { CRM_API_PREFIX } from "@/constants/api-prefix";
import type { ApiResponse } from "@/types/common";
import type {
  DashboardData,
  DashboardKpis,
  DashboardCharts,
  PerformanceMetrics,
} from "@/types/crm/dashboard.types";

const DASHBOARD_PREFIX = `${CRM_API_PREFIX}/dashboard`;

export const dashboardService = {
  /**
   * Get complete CRM dashboard with all KPIs and charts
   * Cached for 5 minutes on server + browser
   */
  getDashboard: async (): Promise<{
    data: DashboardData;
    performance: PerformanceMetrics;
  }> => {
    const response = await ApiService.getRaw<ApiResponse<DashboardData>>(DASHBOARD_PREFIX);

    // Extract performance metrics from response headers
    const performanceMs = response.headers["x-performance-ms"];
    const cacheStatus = response.headers["x-cache-status"] || "MISS";

    return {
      data: response.data.data,
      performance: {
        responseTimeMs: performanceMs ? parseFloat(performanceMs) : 0,
        cacheStatus: cacheStatus as "HIT" | "MISS" | "REFRESHED",
        timestamp: new Date(),
      },
    };
  },

  /**
   * Get KPIs only (lightweight, faster refresh)
   * Cached for 3 minutes
   */
  getKpis: async (): Promise<{
    data: DashboardKpis;
    performance: PerformanceMetrics;
  }> => {
    const response = await ApiService.getRaw<ApiResponse<DashboardKpis>>(
      `${DASHBOARD_PREFIX}/kpis`
    );

    const performanceMs = response.headers["x-performance-ms"];
    const cacheStatus = response.headers["x-cache-status"] || "MISS";

    return {
      data: response.data.data,
      performance: {
        responseTimeMs: performanceMs ? parseFloat(performanceMs) : 0,
        cacheStatus: cacheStatus as "HIT" | "MISS" | "REFRESHED",
        timestamp: new Date(),
      },
    };
  },

  /**
   * Get charts only (for partial refresh)
   * Cached for 10 minutes
   */
  getCharts: async (): Promise<{
    data: DashboardCharts;
    performance: PerformanceMetrics;
  }> => {
    const response = await ApiService.getRaw<ApiResponse<DashboardCharts>>(
      `${DASHBOARD_PREFIX}/charts`
    );

    const performanceMs = response.headers["x-performance-ms"];
    const cacheStatus = response.headers["x-cache-status"] || "MISS";

    return {
      data: response.data.data,
      performance: {
        responseTimeMs: performanceMs ? parseFloat(performanceMs) : 0,
        cacheStatus: cacheStatus as "HIT" | "MISS" | "REFRESHED",
        timestamp: new Date(),
      },
    };
  },

  /**
   * Force refresh dashboard (bypass all caches)
   * Expensive operation - use sparingly
   */
  refreshDashboard: async (): Promise<{
    data: DashboardData;
    performance: PerformanceMetrics;
  }> => {
    const response = await ApiService.postRaw<ApiResponse<DashboardData>>(
      `${DASHBOARD_PREFIX}/refresh`,
      {}
    );

    const performanceMs = response.headers["x-performance-ms"];

    return {
      data: response.data.data,
      performance: {
        responseTimeMs: performanceMs ? parseFloat(performanceMs) : 0,
        cacheStatus: "REFRESHED",
        timestamp: new Date(),
      },
    };
  },

  /**
   * Invalidate dashboard cache (admin operation)
   */
  invalidateCache: async (): Promise<boolean> => {
    return await ApiService.delete<boolean>(`${DASHBOARD_PREFIX}/cache`);
  },

  /**
   * Health check endpoint
   */
  healthCheck: async (): Promise<{
    Service: string;
    Status: string;
    Timestamp: string;
    CacheConfiguration: {
      FullDashboardTtlMinutes: number;
      KpiTtlMinutes: number;
      ChartTtlMinutes: number;
    };
  }> => {
    return await ApiService.get(`${DASHBOARD_PREFIX}/health`);
  },
};
