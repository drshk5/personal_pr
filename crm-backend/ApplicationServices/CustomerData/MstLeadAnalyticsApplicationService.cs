using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Interfaces;

namespace crm_backend.ApplicationServices.CustomerData;

public class MstLeadAnalyticsApplicationService : ApplicationServiceBase, IMstLeadAnalyticsApplicationService
{
    private readonly ILeadAnalyticsService _analyticsService;

    public MstLeadAnalyticsApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        ILeadAnalyticsService analyticsService,
        ILogger<MstLeadAnalyticsApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _analyticsService = analyticsService;
    }

    public async Task<LeadDashboardDto> GetDashboardAsync()
    {
        return await _analyticsService.GetDashboardAsync(GetTenantId());
    }

    public async Task<List<ConversionRateBySourceDto>> GetConversionBySourceAsync(AnalyticsDateRangeParams? dateRange)
    {
        return await _analyticsService.GetConversionBySourceAsync(GetTenantId(), dateRange);
    }

    public async Task<List<ConversionRateByRepDto>> GetConversionByRepAsync(AnalyticsDateRangeParams? dateRange)
    {
        return await _analyticsService.GetConversionByRepAsync(GetTenantId(), dateRange);
    }

    public async Task<LeadVelocityDto> GetVelocityAsync(AnalyticsDateRangeParams? dateRange)
    {
        return await _analyticsService.GetVelocityAsync(GetTenantId(), dateRange);
    }

    public async Task<TimeToConversionDto> GetTimeToConversionAsync(AnalyticsDateRangeParams? dateRange)
    {
        return await _analyticsService.GetTimeToConversionAsync(GetTenantId(), dateRange);
    }

    public async Task<FunnelDto> GetFunnelAsync(AnalyticsDateRangeParams? dateRange)
    {
        return await _analyticsService.GetFunnelAsync(GetTenantId(), dateRange);
    }

    public async Task<List<RepPerformanceDto>> GetRepPerformanceAsync(AnalyticsDateRangeParams? dateRange)
    {
        return await _analyticsService.GetRepPerformanceAsync(GetTenantId(), dateRange);
    }

    public async Task<LeadAgingDto> GetAgingAsync()
    {
        return await _analyticsService.GetAgingAsync(GetTenantId());
    }

    public async Task<ScoreDistributionDto> GetScoreDistributionAsync()
    {
        return await _analyticsService.GetScoreDistributionAsync(GetTenantId());
    }
}
