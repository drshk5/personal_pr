using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.Interfaces;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

/// <summary>
/// High-performance dashboard controller with caching and monitoring
/// </summary>
[Route("api/crm/dashboard")]
[RequireTenantId]
public class DashboardController : BaseController
{
    private readonly IMstDashboardApplicationService _dashboardAppService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(
        IMstDashboardApplicationService dashboardAppService,
        ILogger<DashboardController> logger)
    {
        _dashboardAppService = dashboardAppService;
        _logger = logger;
    }

    /// <summary>
    /// Get complete CRM dashboard with all KPIs and charts
    /// Performance target: Sub-200ms (cached), Sub-800ms (uncached)
    /// </summary>
    [HttpGet]
    [AuthorizePermission("CRM_Dashboard", "View")]
    [ResponseCache(Duration = 300, VaryByHeader = "X-Tenant-Id")] // 5 min HTTP cache
    public async Task<ActionResult<ApiResponse<CrmDashboardDto>>> GetDashboard()
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var dashboard = await _dashboardAppService.GetDashboardAsync();

            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogInformation("Dashboard retrieved in {Duration}ms for user {UserId}",
                duration, GetUserGuid());

            // Add performance metric to response headers
            Response.Headers["X-Performance-Ms"] = duration.ToString("F0");

            return OkResponse(dashboard, "Dashboard retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard for user {UserId}", GetUserGuid());
            return ErrorResponse<CrmDashboardDto>(500, "Failed to retrieve dashboard", "DASHBOARD_ERROR");
        }
    }

    /// <summary>
    /// Get KPI metrics only (lightweight, faster refresh)
    /// Performance target: Sub-100ms (cached), Sub-300ms (uncached)
    /// </summary>
    [HttpGet("kpis")]
    [AuthorizePermission("CRM_Dashboard", "View")]
    [ResponseCache(Duration = 180, VaryByHeader = "X-Tenant-Id")] // 3 min HTTP cache
    public async Task<ActionResult<ApiResponse<DashboardKpisDto>>> GetKpis()
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var kpis = await _dashboardAppService.GetKpisAsync();

            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogInformation("Dashboard KPIs retrieved in {Duration}ms", duration);

            Response.Headers["X-Performance-Ms"] = duration.ToString("F0");

            return OkResponse(kpis, "KPIs retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard KPIs");
            return ErrorResponse<DashboardKpisDto>(500, "Failed to retrieve KPIs", "KPI_ERROR");
        }
    }

    /// <summary>
    /// Get chart data only (for partial refresh)
    /// Performance target: Sub-150ms (cached), Sub-400ms (uncached)
    /// </summary>
    [HttpGet("charts")]
    [AuthorizePermission("CRM_Dashboard", "View")]
    [ResponseCache(Duration = 600, VaryByHeader = "X-Tenant-Id")] // 10 min HTTP cache (charts change less)
    public async Task<ActionResult<ApiResponse<DashboardChartsDto>>> GetCharts()
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var charts = await _dashboardAppService.GetChartsAsync();

            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogInformation("Dashboard charts retrieved in {Duration}ms", duration);

            Response.Headers["X-Performance-Ms"] = duration.ToString("F0");

            return OkResponse(charts, "Charts retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard charts");
            return ErrorResponse<DashboardChartsDto>(500, "Failed to retrieve charts", "CHART_ERROR");
        }
    }

    /// <summary>
    /// Force refresh dashboard (bypass all caches)
    /// Use sparingly - expensive operation
    /// </summary>
    [HttpPost("refresh")]
    [AuthorizePermission("CRM_Dashboard", "Edit")]
    public async Task<ActionResult<ApiResponse<CrmDashboardDto>>> RefreshDashboard()
    {
        var startTime = DateTime.UtcNow;

        _logger.LogWarning("Dashboard force refresh requested by user {UserId}", GetUserGuid());

        try
        {
            var dashboard = await _dashboardAppService.RefreshDashboardAsync();

            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogInformation("Dashboard force refreshed in {Duration}ms", duration);

            Response.Headers["X-Performance-Ms"] = duration.ToString("F0");
            Response.Headers["X-Cache-Status"] = "REFRESHED";

            return OkResponse(dashboard, "Dashboard refreshed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error force refreshing dashboard");
            return ErrorResponse<CrmDashboardDto>(500, "Failed to refresh dashboard", "REFRESH_ERROR");
        }
    }

    /// <summary>
    /// Invalidate dashboard cache (for admin/debugging)
    /// </summary>
    [HttpDelete("cache")]
    [AuthorizePermission("CRM_Dashboard", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> InvalidateCache()
    {
        _logger.LogWarning("Dashboard cache invalidation requested by user {UserId}", GetUserGuid());

        try
        {
            await _dashboardAppService.InvalidateCacheAsync();
            return OkResponse(true, "Dashboard cache invalidated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating dashboard cache");
            return ErrorResponse<bool>(500, "Failed to invalidate cache", "CACHE_ERROR");
        }
    }

    /// <summary>
    /// Health check endpoint for monitoring dashboard performance
    /// </summary>
    [HttpGet("health")]
    public ActionResult<ApiResponse<Dictionary<string, object>>> HealthCheck()
    {
        var healthData = new Dictionary<string, object>
        {
            ["Service"] = "Dashboard",
            ["Status"] = "Healthy",
            ["Timestamp"] = DateTime.UtcNow,
            ["CacheConfiguration"] = new Dictionary<string, int>
            {
                ["FullDashboardTtlMinutes"] = 15,
                ["KpiTtlMinutes"] = 10,
                ["ChartTtlMinutes"] = 30
            }
        };

        return OkResponse(healthData);
    }
}
