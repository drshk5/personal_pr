using crm_backend.DTOs.CustomerData;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstLeadAnalyticsApplicationService : IApplicationService
{
    Task<LeadDashboardDto> GetDashboardAsync();
    Task<List<ConversionRateBySourceDto>> GetConversionBySourceAsync(AnalyticsDateRangeParams? dateRange);
    Task<List<ConversionRateByRepDto>> GetConversionByRepAsync(AnalyticsDateRangeParams? dateRange);
    Task<LeadVelocityDto> GetVelocityAsync(AnalyticsDateRangeParams? dateRange);
    Task<TimeToConversionDto> GetTimeToConversionAsync(AnalyticsDateRangeParams? dateRange);
    Task<FunnelDto> GetFunnelAsync(AnalyticsDateRangeParams? dateRange);
    Task<List<RepPerformanceDto>> GetRepPerformanceAsync(AnalyticsDateRangeParams? dateRange);
    Task<LeadAgingDto> GetAgingAsync();
    Task<ScoreDistributionDto> GetScoreDistributionAsync();
}
