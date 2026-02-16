using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Interfaces;

namespace crm_backend.ApplicationServices.CustomerData;

/// <summary>
/// Dashboard application service with multi-tier caching strategy
/// </summary>
public class MstDashboardApplicationService : ApplicationServiceBase, IMstDashboardApplicationService
{
    private readonly IDashboardService _dashboardService;
    private readonly IMemoryCache _cache;

    // Cache TTL configuration
    private static readonly TimeSpan FullDashboardTtl = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan KpiTtl = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan ChartTtl = TimeSpan.FromMinutes(30);

    public MstDashboardApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        IDashboardService dashboardService,
        IMemoryCache cache,
        ILogger<MstDashboardApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _dashboardService = dashboardService;
        _cache = cache;
    }

    public async Task<CrmDashboardDto> GetDashboardAsync()
    {
        var tenantId = GetTenantId();
        var cacheKey = GetDashboardCacheKey(tenantId);

        // Try to get from cache
        if (_cache.TryGetValue(cacheKey, out CrmDashboardDto? cachedDashboard) && cachedDashboard != null)
        {
            _logger.LogInformation("Dashboard cache HIT for tenant {TenantId}", tenantId);
            return cachedDashboard;
        }

        _logger.LogInformation("Dashboard cache MISS for tenant {TenantId}, generating...", tenantId);

        // Generate dashboard
        var dashboard = await _dashboardService.GetDashboardDataAsync(tenantId);

        // Validate before caching
        if (_dashboardService.ValidateDashboardData(dashboard))
        {
            // Cache with absolute expiration
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = FullDashboardTtl,
                Priority = CacheItemPriority.High, // Dashboard is high priority
                Size = 1 // For cache size management
            };

            _cache.Set(cacheKey, dashboard, cacheOptions);
            _logger.LogInformation("Dashboard cached for tenant {TenantId} with TTL {TTL}", tenantId, FullDashboardTtl);
        }
        else
        {
            _logger.LogWarning("Dashboard validation failed for tenant {TenantId}, not caching", tenantId);
        }

        return dashboard;
    }

    public async Task<DashboardKpisDto> GetKpisAsync()
    {
        var tenantId = GetTenantId();
        var cacheKey = GetKpiCacheKey(tenantId);

        if (_cache.TryGetValue(cacheKey, out DashboardKpisDto? cachedKpis) && cachedKpis != null)
        {
            _logger.LogInformation("KPI cache HIT for tenant {TenantId}", tenantId);
            return cachedKpis;
        }

        _logger.LogInformation("KPI cache MISS for tenant {TenantId}", tenantId);
        var kpis = await _dashboardService.GetKpisOnlyAsync(tenantId);

        _cache.Set(cacheKey, kpis, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = KpiTtl,
            Priority = CacheItemPriority.High,
            Size = 1
        });

        return kpis;
    }

    public async Task<DashboardChartsDto> GetChartsAsync()
    {
        var tenantId = GetTenantId();
        var cacheKey = GetChartCacheKey(tenantId);

        if (_cache.TryGetValue(cacheKey, out DashboardChartsDto? cachedCharts) && cachedCharts != null)
        {
            _logger.LogInformation("Chart cache HIT for tenant {TenantId}", tenantId);
            return cachedCharts;
        }

        _logger.LogInformation("Chart cache MISS for tenant {TenantId}", tenantId);
        var charts = await _dashboardService.GetChartsOnlyAsync(tenantId);

        _cache.Set(cacheKey, charts, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ChartTtl,
            Priority = CacheItemPriority.Normal, // Charts can be lower priority
            Size = 1
        });

        return charts;
    }

    public async Task<CrmDashboardDto> RefreshDashboardAsync()
    {
        var tenantId = GetTenantId();

        _logger.LogInformation("Force refreshing dashboard for tenant {TenantId}", tenantId);

        // Invalidate all caches first
        await InvalidateCacheAsync();

        // Generate fresh data (will be cached by GetDashboardAsync)
        return await GetDashboardAsync();
    }

    public Task InvalidateCacheAsync()
    {
        var tenantId = GetTenantId();

        _logger.LogInformation("Invalidating dashboard caches for tenant {TenantId}", tenantId);

        // Remove all dashboard caches
        _cache.Remove(GetDashboardCacheKey(tenantId));
        _cache.Remove(GetKpiCacheKey(tenantId));
        _cache.Remove(GetChartCacheKey(tenantId));

        return Task.CompletedTask;
    }

    #region Private Cache Key Methods

    private static string GetDashboardCacheKey(Guid tenantId) => $"dashboard:{tenantId}:full";
    private static string GetKpiCacheKey(Guid tenantId) => $"dashboard:{tenantId}:kpis";
    private static string GetChartCacheKey(Guid tenantId) => $"dashboard:{tenantId}:charts";

    #endregion
}
