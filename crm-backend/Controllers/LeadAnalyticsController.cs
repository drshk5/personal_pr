using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/lead-analytics")]
public class LeadAnalyticsController : BaseController
{
    private readonly IMstLeadAnalyticsApplicationService _analyticsAppService;

    public LeadAnalyticsController(IMstLeadAnalyticsApplicationService analyticsAppService)
        => _analyticsAppService = analyticsAppService;

    [HttpGet("dashboard")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Analytics", "View")]
    public async Task<ActionResult<ApiResponse<LeadDashboardDto>>> GetDashboard()
    {
        var result = await _analyticsAppService.GetDashboardAsync();
        return OkResponse(result);
    }

    [HttpGet("conversion-rate/by-source")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Analytics", "View")]
    public async Task<ActionResult<ApiResponse<List<ConversionRateBySourceDto>>>> GetConversionBySource(
        [FromQuery] AnalyticsDateRangeParams dateRange)
    {
        var result = await _analyticsAppService.GetConversionBySourceAsync(dateRange);
        return OkResponse(result);
    }

    [HttpGet("conversion-rate/by-rep")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Analytics", "View")]
    public async Task<ActionResult<ApiResponse<List<ConversionRateByRepDto>>>> GetConversionByRep(
        [FromQuery] AnalyticsDateRangeParams dateRange)
    {
        var result = await _analyticsAppService.GetConversionByRepAsync(dateRange);
        return OkResponse(result);
    }

    [HttpGet("velocity")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Analytics", "View")]
    public async Task<ActionResult<ApiResponse<LeadVelocityDto>>> GetVelocity(
        [FromQuery] AnalyticsDateRangeParams dateRange)
    {
        var result = await _analyticsAppService.GetVelocityAsync(dateRange);
        return OkResponse(result);
    }

    [HttpGet("time-to-conversion")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Analytics", "View")]
    public async Task<ActionResult<ApiResponse<TimeToConversionDto>>> GetTimeToConversion(
        [FromQuery] AnalyticsDateRangeParams dateRange)
    {
        var result = await _analyticsAppService.GetTimeToConversionAsync(dateRange);
        return OkResponse(result);
    }

    [HttpGet("funnel")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Analytics", "View")]
    public async Task<ActionResult<ApiResponse<FunnelDto>>> GetFunnel(
        [FromQuery] AnalyticsDateRangeParams dateRange)
    {
        var result = await _analyticsAppService.GetFunnelAsync(dateRange);
        return OkResponse(result);
    }

    [HttpGet("rep-performance")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Analytics", "View")]
    public async Task<ActionResult<ApiResponse<List<RepPerformanceDto>>>> GetRepPerformance(
        [FromQuery] AnalyticsDateRangeParams dateRange)
    {
        var result = await _analyticsAppService.GetRepPerformanceAsync(dateRange);
        return OkResponse(result);
    }

    [HttpGet("aging")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Analytics", "View")]
    public async Task<ActionResult<ApiResponse<LeadAgingDto>>> GetAging()
    {
        var result = await _analyticsAppService.GetAgingAsync();
        return OkResponse(result);
    }

    [HttpGet("score-distribution")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Analytics", "View")]
    public async Task<ActionResult<ApiResponse<ScoreDistributionDto>>> GetScoreDistribution()
    {
        var result = await _analyticsAppService.GetScoreDistributionAsync();
        return OkResponse(result);
    }
}
