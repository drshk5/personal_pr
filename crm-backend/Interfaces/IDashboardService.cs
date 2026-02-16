using crm_backend.DTOs.CustomerData;

namespace crm_backend.Interfaces;

/// <summary>
/// Service interface for CRM dashboard business logic and calculations
/// </summary>
public interface IDashboardService
{
    /// <summary>
    /// Get complete dashboard data with all KPIs and charts
    /// </summary>
    Task<CrmDashboardDto> GetDashboardDataAsync(Guid tenantId);

    /// <summary>
    /// Get only KPI metrics (faster, for partial refreshes)
    /// </summary>
    Task<DashboardKpisDto> GetKpisOnlyAsync(Guid tenantId);

    /// <summary>
    /// Get only chart data (for partial refreshes)
    /// </summary>
    Task<DashboardChartsDto> GetChartsOnlyAsync(Guid tenantId);

    /// <summary>
    /// Calculate sales velocity: (OpenDeals × AvgDealSize × WinRate) / AvgSalesCycleDays
    /// </summary>
    decimal CalculateSalesVelocity(int openDeals, decimal avgDealSize, double winRate, double avgSalesCycle);

    /// <summary>
    /// Validate dashboard data integrity
    /// </summary>
    bool ValidateDashboardData(CrmDashboardDto dashboard);
}

/// <summary>
/// KPI-only DTO for partial refreshes
/// </summary>
public class DashboardKpisDto
{
    public int intTotalLeads { get; set; }
    public int intQualifiedLeads { get; set; }
    public int intTotalOpenOpportunities { get; set; }
    public decimal dblTotalPipelineValue { get; set; }
    public decimal dblWeightedPipelineValue { get; set; }
    public decimal dblWonRevenue { get; set; }
    public decimal dblLostRevenue { get; set; }
    public double dblWinRate { get; set; }
    public double dblAvgSalesCycleDays { get; set; }
    public decimal dblSalesVelocity { get; set; }
    public int intRottingOpportunities { get; set; }
    public int intActivitiesThisWeek { get; set; }
}

/// <summary>
/// Chart-only DTO for partial refreshes
/// </summary>
public class DashboardChartsDto
{
    public List<PipelineStageSummaryDto> PipelineStages { get; set; } = new();
    public List<LeadsBySourceDto> LeadsBySource { get; set; } = new();
    public List<LeadsByStatusDto> LeadsByStatus { get; set; } = new();
    public List<RevenueByMonthDto> RevenueByMonth { get; set; } = new();
    public List<TopOpportunityDto> TopOpportunities { get; set; } = new();
    public List<UpcomingActivityDto> UpcomingActivities { get; set; } = new();
}
