using crm_backend.DTOs.CustomerData;

namespace crm_backend.Interfaces;

public interface ILeadAnalyticsService
{
    Task<LeadDashboardDto> GetDashboardAsync(Guid tenantId);
    Task<List<ConversionRateBySourceDto>> GetConversionBySourceAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange);
    Task<List<ConversionRateByRepDto>> GetConversionByRepAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange);
    Task<LeadVelocityDto> GetVelocityAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange);
    Task<TimeToConversionDto> GetTimeToConversionAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange);
    Task<FunnelDto> GetFunnelAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange);
    Task<List<RepPerformanceDto>> GetRepPerformanceAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange);
    Task<LeadAgingDto> GetAgingAsync(Guid tenantId);
    Task<ScoreDistributionDto> GetScoreDistributionAsync(Guid tenantId);
}
