using crm_backend.DTOs.CustomerData;
using crm_backend.Interfaces;

namespace crm_backend.ApplicationServices.Interfaces;

/// <summary>
/// Application service interface for dashboard orchestration and caching
/// </summary>
public interface IMstDashboardApplicationService : IApplicationService
{
    /// <summary>
    /// Get complete CRM dashboard with aggressive caching (15 min TTL)
    /// </summary>
    Task<CrmDashboardDto> GetDashboardAsync();

    /// <summary>
    /// Get KPIs only (faster, partial refresh)
    /// </summary>
    Task<DashboardKpisDto> GetKpisAsync();

    /// <summary>
    /// Get charts only (partial refresh)
    /// </summary>
    Task<DashboardChartsDto> GetChartsAsync();

    /// <summary>
    /// Force refresh dashboard data (bypass cache)
    /// </summary>
    Task<CrmDashboardDto> RefreshDashboardAsync();

    /// <summary>
    /// Invalidate dashboard cache for current tenant
    /// </summary>
    Task InvalidateCacheAsync();
}
