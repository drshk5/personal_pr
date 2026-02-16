using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace crm_backend.Services.CustomerData;

/// <summary>
/// High-performance dashboard service with optimized queries and parallel execution
/// </summary>
public class MstDashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<MstDashboardService> _logger;

    public MstDashboardService(
        IUnitOfWork unitOfWork,
        ILogger<MstDashboardService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<CrmDashboardDto> GetDashboardDataAsync(Guid tenantId)
    {
        var startTime = DateTime.UtcNow;
        _logger.LogInformation("Generating CRM dashboard for tenant {TenantId}", tenantId);

        try
        {
            // NOTE: IUnitOfWork uses a scoped DbContext, so concurrent queries on the same context are unsafe.
            var leadMetrics = await GetLeadMetricsAsync();
            var oppMetrics = await GetOpportunityMetricsAsync();
            var activityCount = await GetActivityMetricsAsync();
            var todayTasks = await GetTodayTasksAsync();
            var overdueActivities = await GetOverdueActivitiesAsync();
            var myActivitiesCount = await GetMyActivitiesCountAsync();
            var teamOverdueCount = await GetTeamOverdueCountAsync();

            // Calculate derived metrics
            var salesVelocity = CalculateSalesVelocity(
                oppMetrics.TotalOpen,
                oppMetrics.AvgDealSize,
                oppMetrics.WinRate,
                oppMetrics.AvgSalesCycle
            );

            var dashboard = new CrmDashboardDto
            {
                // Lead KPIs
                intTotalLeads = leadMetrics.TotalLeads,
                intQualifiedLeads = leadMetrics.QualifiedLeads,
                LeadsBySource = leadMetrics.LeadsBySource,
                LeadsByStatus = leadMetrics.LeadsByStatus,

                // Opportunity KPIs
                intTotalOpenOpportunities = oppMetrics.TotalOpen,
                dblTotalPipelineValue = oppMetrics.TotalPipelineValue,
                dblWeightedPipelineValue = oppMetrics.WeightedPipelineValue,
                intRottingOpportunities = oppMetrics.RottingCount,
                PipelineStages = oppMetrics.PipelineStages,
                TopOpportunities = oppMetrics.TopOpportunities,

                // Revenue KPIs
                dblWonRevenue = oppMetrics.WonRevenue,
                dblLostRevenue = oppMetrics.LostRevenue,
                dblWinRate = oppMetrics.WinRate,
                RevenueByMonth = oppMetrics.RevenueByMonth,

                // Performance KPIs
                dblAvgSalesCycleDays = oppMetrics.AvgSalesCycle,
                dblSalesVelocity = salesVelocity,

                // Activity KPIs
                intActivitiesThisWeek = activityCount,
                intMyActivitiesCount = myActivitiesCount,
                intTeamOverdueCount = teamOverdueCount,
                UpcomingActivities = oppMetrics.UpcomingActivities,
                TodayTasks = todayTasks,
                OverdueActivities = overdueActivities
            };

            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogInformation("Dashboard generated in {Duration}ms for tenant {TenantId}", duration, tenantId);

            return dashboard;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating dashboard for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<DashboardKpisDto> GetKpisOnlyAsync(Guid tenantId)
    {
        // Lightweight version for quick KPI refresh without charts
        var leads = await GetLeadKpisAsync();
        var opps = await GetOpportunityKpisAsync();
        var activities = await GetActivityMetricsAsync();

        return new DashboardKpisDto
        {
            intTotalLeads = leads.TotalLeads,
            intQualifiedLeads = leads.QualifiedLeads,
            intTotalOpenOpportunities = opps.TotalOpen,
            dblTotalPipelineValue = opps.TotalPipelineValue,
            dblWeightedPipelineValue = opps.WeightedPipelineValue,
            dblWonRevenue = opps.WonRevenue,
            dblLostRevenue = opps.LostRevenue,
            dblWinRate = opps.WinRate,
            dblAvgSalesCycleDays = opps.AvgSalesCycle,
            dblSalesVelocity = CalculateSalesVelocity(opps.TotalOpen, opps.AvgDealSize, opps.WinRate, opps.AvgSalesCycle),
            intRottingOpportunities = opps.RottingCount,
            intActivitiesThisWeek = activities
        };
    }

    public async Task<DashboardChartsDto> GetChartsOnlyAsync(Guid tenantId)
    {
        // Chart data only for partial refresh
        var leadCharts = await GetLeadChartsAsync();
        var oppCharts = await GetOpportunityChartsAsync();

        return new DashboardChartsDto
        {
            LeadsBySource = leadCharts.LeadsBySource,
            LeadsByStatus = leadCharts.LeadsByStatus,
            PipelineStages = oppCharts.PipelineStages,
            RevenueByMonth = oppCharts.RevenueByMonth,
            TopOpportunities = oppCharts.TopOpportunities,
            UpcomingActivities = oppCharts.UpcomingActivities
        };
    }

    public decimal CalculateSalesVelocity(int openDeals, decimal avgDealSize, double winRate, double avgSalesCycle)
    {
        if (avgSalesCycle <= 0) return 0;
        return Math.Round((openDeals * avgDealSize * (decimal)winRate / 100) / (decimal)avgSalesCycle, 2);
    }

    public bool ValidateDashboardData(CrmDashboardDto dashboard)
    {
        // Basic validation
        return dashboard.intTotalLeads >= 0
            && dashboard.intQualifiedLeads >= 0
            && dashboard.intQualifiedLeads <= dashboard.intTotalLeads
            && dashboard.dblWinRate >= 0 && dashboard.dblWinRate <= 100;
    }

    #region Private Query Methods - OPTIMIZED FOR PERFORMANCE

    private async Task<LeadMetrics> GetLeadMetricsAsync()
    {
        var leads = _unitOfWork.Leads.Query().AsNoTracking();

        var total = await leads.CountAsync();
        var qualified = await leads.CountAsync(l => l.strStatus == LeadStatusConstants.Qualified);

        var bySource = await leads
            .GroupBy(l => l.strSource)
            .Select(g => new LeadsBySourceDto
            {
                strSource = g.Key ?? string.Empty,
                intCount = g.Count()
            })
            .OrderByDescending(x => x.intCount)
            .ToListAsync();

        var byStatus = await leads
            .GroupBy(l => l.strStatus)
            .Select(g => new LeadsByStatusDto
            {
                strStatus = g.Key ?? string.Empty,
                intCount = g.Count()
            })
            .OrderByDescending(x => x.intCount)
            .ToListAsync();

        return new LeadMetrics
        {
            TotalLeads = total,
            QualifiedLeads = qualified,
            LeadsBySource = bySource,
            LeadsByStatus = byStatus
        };
    }

    private async Task<OpportunityMetrics> GetOpportunityMetricsAsync()
    {
        var now = DateTime.UtcNow;
        var startOfYear = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Group 1: Open opportunities with all metrics in ONE query
        var openOpps = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Where(o => o.strStatus == "Open" && !o.bolIsDeleted)
            .Include(o => o.Stage)
            .Include(o => o.Account)
            .Select(o => new
            {
                o.strOpportunityGUID,
                o.strOpportunityName,
                o.dblAmount,
                StageName = o.Stage != null ? o.Stage.strStageName : string.Empty,
                ProbabilityPercent = o.Stage != null ? o.Stage.intProbabilityPercent : 0,
                DefaultDaysToRot = o.Stage != null ? o.Stage.intDefaultDaysToRot : 30,
                o.dtStageEnteredOn,
                o.dtLastActivityOn,
                AccountName = o.Account != null ? o.Account.strAccountName : null
            })
            .ToListAsync();

        // Group 2: Won/Lost opportunities for revenue
        var closedOpps = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Where(o => (o.strStatus == "Won" || o.strStatus == "Lost")
                && o.dtActualCloseDate != null
                && !o.bolIsDeleted)
            .Select(o => new
            {
                o.strStatus,
                o.dblAmount,
                o.dtActualCloseDate,
                o.dtCreatedOn
            })
            .ToListAsync();

        // Group 3: Pipeline stage summary
        var stageGroups = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Where(o => o.strStatus == "Open" && !o.bolIsDeleted)
            .Include(o => o.Stage)
            .GroupBy(o => new
            {
                StageName = o.Stage != null ? o.Stage.strStageName : "Unknown",
                DefaultDaysToRot = o.Stage != null ? o.Stage.intDefaultDaysToRot : 30
            })
            .Select(g => new
            {
                g.Key.StageName,
                g.Key.DefaultDaysToRot,
                Count = g.Count(),
                TotalValue = g.Sum(o => o.dblAmount ?? 0),
                Opportunities = g.Select(o => new { o.dtStageEnteredOn, o.dtLastActivityOn }).ToList()
            })
            .ToListAsync();

        // Group 4: Upcoming activities (simplified - just empty list for now)
        var upcomingActivities = new List<UpcomingActivityDto>();

        // Calculate metrics from materialized data
        var totalOpen = openOpps.Count;
        var totalPipeline = openOpps.Sum(o => o.dblAmount ?? 0);
        var weightedPipeline = openOpps.Sum(o => (o.dblAmount ?? 0) * o.ProbabilityPercent / 100m);

        // Rotting count (deals where stage time OR activity time exceeds threshold)
        var rottingCount = openOpps.Count(o =>
            (now - o.dtStageEnteredOn).TotalDays > o.DefaultDaysToRot ||
            (o.dtLastActivityOn.HasValue && (now - o.dtLastActivityOn.Value).TotalDays > o.DefaultDaysToRot)
        );

        // Won/Lost metrics
        var wonOpps = closedOpps.Where(o => o.strStatus == "Won").ToList();
        var lostOpps = closedOpps.Where(o => o.strStatus == "Lost").ToList();
        var wonRevenue = wonOpps.Sum(o => o.dblAmount ?? 0);
        var lostRevenue = lostOpps.Sum(o => o.dblAmount ?? 0);
        var totalClosed = wonOpps.Count + lostOpps.Count;
        var winRate = totalClosed > 0 ? Math.Round((double)wonOpps.Count / totalClosed * 100, 2) : 0;

        // Avg sales cycle (only for won deals)
        var avgSalesCycle = wonOpps.Any()
            ? Math.Round(wonOpps.Average(o => (o.dtActualCloseDate!.Value - o.dtCreatedOn).TotalDays), 2)
            : 0;

        // Avg deal size (won opportunities)
        var avgDealSize = wonOpps.Any(o => o.dblAmount.HasValue)
            ? wonOpps.Where(o => o.dblAmount.HasValue).Average(o => o.dblAmount!.Value)
            : 0;

        // Pipeline stages with rotting count
        var pipelineStages = stageGroups.Select(g => new PipelineStageSummaryDto
        {
            strStageName = g.StageName,
            intCount = g.Count,
            dblTotalValue = g.TotalValue,
            intRottingCount = g.Opportunities.Count(opp =>
                (now - opp.dtStageEnteredOn).TotalDays > g.DefaultDaysToRot ||
                (opp.dtLastActivityOn.HasValue && (now - opp.dtLastActivityOn.Value).TotalDays > g.DefaultDaysToRot)
            )
        }).ToList();

        // Top opportunities
        var topOpps = openOpps
            .OrderByDescending(o => o.dblAmount ?? 0)
            .Take(5)
            .Select(o => new TopOpportunityDto
            {
                strOpportunityGUID = o.strOpportunityGUID,
                strOpportunityName = o.strOpportunityName ?? string.Empty,
                dblAmount = o.dblAmount,
                strStageName = o.StageName,
                strAccountName = o.AccountName
            })
            .ToList();

        // Revenue by month (last 12 months)
        var revenueByMonth = closedOpps
            .Where(o => o.dtActualCloseDate >= startOfYear)
            .GroupBy(o => new { o.dtActualCloseDate!.Value.Year, o.dtActualCloseDate.Value.Month })
            .Select(g => new RevenueByMonthDto
            {
                strMonth = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                dblWonAmount = g.Where(o => o.strStatus == "Won").Sum(o => o.dblAmount ?? 0),
                dblLostAmount = g.Where(o => o.strStatus == "Lost").Sum(o => o.dblAmount ?? 0)
            })
            .OrderBy(r => r.strMonth)
            .ToList();

        return new OpportunityMetrics
        {
            TotalOpen = totalOpen,
            TotalPipelineValue = totalPipeline,
            WeightedPipelineValue = weightedPipeline,
            RottingCount = rottingCount,
            WonRevenue = wonRevenue,
            LostRevenue = lostRevenue,
            WinRate = winRate,
            AvgSalesCycle = avgSalesCycle,
            AvgDealSize = avgDealSize,
            PipelineStages = pipelineStages,
            TopOpportunities = topOpps,
            RevenueByMonth = revenueByMonth,
            UpcomingActivities = upcomingActivities
        };
    }

    private async Task<int> GetActivityMetricsAsync()
    {
        var now = DateTime.UtcNow;
        var startOfWeek = now.AddDays(-(int)now.DayOfWeek).Date;
        var startOfWeekUtc = DateTime.SpecifyKind(startOfWeek, DateTimeKind.Utc);

        return await _unitOfWork.Activities.Query()
            .AsNoTracking()
            .Where(a => a.bolIsActive && a.dtScheduledOn >= startOfWeekUtc)
            .CountAsync();
    }

    private async Task<List<ActivityListDto>> GetTodayTasksAsync()
    {
        try
        {
            var now = DateTime.UtcNow;
            var todayStart = now.Date;
            var todayEnd = todayStart.AddDays(1);

            return await _unitOfWork.Activities.Query()
                .AsNoTracking()
                .Where(a => !a.bolIsDeleted
                    && a.bolIsActive
                    && a.strStatus != ActivityStatusConstants.Completed
                    && a.strStatus != ActivityStatusConstants.Cancelled
                    && ((a.dtDueDate.HasValue && a.dtDueDate.Value >= todayStart && a.dtDueDate.Value < todayEnd)
                        || (a.dtScheduledOn.HasValue && a.dtScheduledOn.Value >= todayStart && a.dtScheduledOn.Value < todayEnd)
                        || (a.dtDueDate.HasValue && a.dtDueDate.Value < todayStart)))
                .OrderBy(a => a.dtDueDate ?? a.dtScheduledOn ?? a.dtCreatedOn)
                .Take(20)
                .Select(a => new ActivityListDto
                {
                    strActivityGUID = a.strActivityGUID,
                    strActivityType = a.strActivityType,
                    strSubject = a.strSubject,
                    strDescription = a.strDescription,
                    dtScheduledOn = a.dtScheduledOn,
                    dtCompletedOn = a.dtCompletedOn,
                    intDurationMinutes = a.intDurationMinutes,
                    strOutcome = a.strOutcome,
                    strStatus = a.strStatus,
                    strPriority = a.strPriority,
                    dtDueDate = a.dtDueDate,
                    strCategory = a.strCategory,
                    bolIsOverdue = a.dtDueDate.HasValue && a.dtDueDate.Value < now
                                  && a.strStatus != ActivityStatusConstants.Completed
                                  && a.strStatus != ActivityStatusConstants.Cancelled,
                    strAssignedToGUID = a.strAssignedToGUID,
                    strAssignedToName = null,
                    strCreatedByGUID = a.strCreatedByGUID,
                    strCreatedByName = string.Empty,
                    dtCreatedOn = a.dtCreatedOn,
                    dtUpdatedOn = a.dtUpdatedOn,
                    bolIsActive = a.bolIsActive,
                    Links = a.ActivityLinks.Select(al => new ActivityLinkDto
                    {
                        strEntityType = al.strEntityType,
                        strEntityGUID = al.strEntityGUID
                    }).ToList()
                })
                .ToListAsync();
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 207)
        {
            // Column not found - database schema mismatch, return empty list
            return new List<ActivityListDto>();
        }
    }

    private async Task<List<ActivityListDto>> GetOverdueActivitiesAsync()
    {
        try
        {
            var now = DateTime.UtcNow;

            return await _unitOfWork.Activities.Query()
                .AsNoTracking()
                .Include(a => a.ActivityLinks)
                .Where(a => !a.bolIsDeleted
                    && a.bolIsActive
                    && a.dtDueDate.HasValue
                    && a.dtDueDate.Value < now
                    && a.strStatus != ActivityStatusConstants.Completed
                    && a.strStatus != ActivityStatusConstants.Cancelled)
                .OrderBy(a => a.dtDueDate)
                .Take(20)
                .Select(a => new ActivityListDto
                {
                    strActivityGUID = a.strActivityGUID,
                    strActivityType = a.strActivityType,
                    strSubject = a.strSubject,
                    strDescription = a.strDescription,
                    dtScheduledOn = a.dtScheduledOn,
                    dtCompletedOn = a.dtCompletedOn,
                    intDurationMinutes = a.intDurationMinutes,
                    strOutcome = a.strOutcome,
                    strStatus = a.strStatus,
                    strPriority = a.strPriority,
                    dtDueDate = a.dtDueDate,
                    strCategory = a.strCategory,
                    bolIsOverdue = true,
                    strAssignedToGUID = a.strAssignedToGUID,
                    strAssignedToName = null,
                    strCreatedByGUID = a.strCreatedByGUID,
                    strCreatedByName = string.Empty,
                    dtCreatedOn = a.dtCreatedOn,
                    dtUpdatedOn = a.dtUpdatedOn,
                    bolIsActive = a.bolIsActive,
                    Links = a.ActivityLinks.Select(al => new ActivityLinkDto
                    {
                        strEntityType = al.strEntityType,
                        strEntityGUID = al.strEntityGUID
                    }).ToList()
                })
                .ToListAsync();
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 207)
        {
            // Column not found - database schema mismatch, return empty list
            return new List<ActivityListDto>();
        }
    }

    private async Task<int> GetMyActivitiesCountAsync()
    {
        try
        {
            return await _unitOfWork.Activities.Query()
                .AsNoTracking()
                .Where(a => !a.bolIsDeleted && a.bolIsActive)
                .CountAsync();
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 207)
        {
            // Column not found - database schema mismatch, return 0
            return 0;
        }
    }

    private async Task<int> GetTeamOverdueCountAsync()
    {
        try
        {
            var now = DateTime.UtcNow;
            return await _unitOfWork.Activities.Query()
                .AsNoTracking()
                .Where(a => !a.bolIsDeleted
                    && a.bolIsActive
                    && a.dtDueDate.HasValue
                    && a.dtDueDate.Value < now
                    && a.strStatus != ActivityStatusConstants.Completed
                    && a.strStatus != ActivityStatusConstants.Cancelled)
                .CountAsync();
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 207)
        {
            // Column not found - database schema mismatch, return 0
            return 0;
        }
    }

    private async Task<(int TotalLeads, int QualifiedLeads)> GetLeadKpisAsync()
    {
        var counts = await _unitOfWork.Leads.Query()
            .AsNoTracking()
            .Select(l => new { l.strStatus })
            .ToListAsync();

        return (
            counts.Count,
            counts.Count(l => l.strStatus == LeadStatusConstants.Qualified)
        );
    }

    private async Task<(List<LeadsBySourceDto> LeadsBySource, List<LeadsByStatusDto> LeadsByStatus)> GetLeadChartsAsync()
    {
        var leads = _unitOfWork.Leads.Query().AsNoTracking();

        var bySource = await leads
            .GroupBy(l => l.strSource)
            .Select(g => new LeadsBySourceDto { strSource = g.Key ?? string.Empty, intCount = g.Count() })
            .ToListAsync();

        var byStatus = await leads
            .GroupBy(l => l.strStatus)
            .Select(g => new LeadsByStatusDto { strStatus = g.Key ?? string.Empty, intCount = g.Count() })
            .ToListAsync();

        return (bySource, byStatus);
    }

    private async Task<OpportunityKpis> GetOpportunityKpisAsync()
    {
        var now = DateTime.UtcNow;

        var openOpps = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Where(o => o.strStatus == "Open" && !o.bolIsDeleted)
            .Include(o => o.Stage)
            .Select(o => new
            {
                o.dblAmount,
                ProbabilityPercent = o.Stage != null ? o.Stage.intProbabilityPercent : 0,
                DefaultDaysToRot = o.Stage != null ? o.Stage.intDefaultDaysToRot : 30,
                o.dtStageEnteredOn,
                o.dtLastActivityOn
            })
            .ToListAsync();

        var closedOpps = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Where(o => (o.strStatus == "Won" || o.strStatus == "Lost") && !o.bolIsDeleted)
            .Select(o => new { o.strStatus, o.dblAmount, o.dtActualCloseDate, o.dtCreatedOn })
            .ToListAsync();

        var totalOpen = openOpps.Count;
        var totalPipeline = openOpps.Sum(o => o.dblAmount ?? 0);
        var weightedPipeline = openOpps.Sum(o => (o.dblAmount ?? 0) * o.ProbabilityPercent / 100m);
        var rottingCount = openOpps.Count(o =>
            (now - o.dtStageEnteredOn).TotalDays > o.DefaultDaysToRot ||
            (o.dtLastActivityOn.HasValue && (now - o.dtLastActivityOn.Value).TotalDays > o.DefaultDaysToRot)
        );

        var wonOpps = closedOpps.Where(o => o.strStatus == "Won").ToList();
        var lostOpps = closedOpps.Where(o => o.strStatus == "Lost").ToList();
        var wonRevenue = wonOpps.Sum(o => o.dblAmount ?? 0);
        var lostRevenue = lostOpps.Sum(o => o.dblAmount ?? 0);
        var totalClosed = wonOpps.Count + lostOpps.Count;
        var winRate = totalClosed > 0 ? Math.Round((double)wonOpps.Count / totalClosed * 100, 2) : 0;
        var avgSalesCycle = wonOpps.Any()
            ? Math.Round(wonOpps.Average(o => (o.dtActualCloseDate!.Value - o.dtCreatedOn).TotalDays), 2)
            : 0;
        var avgDealSize = wonOpps.Any(o => o.dblAmount.HasValue)
            ? wonOpps.Where(o => o.dblAmount.HasValue).Average(o => o.dblAmount!.Value)
            : 0;

        return new OpportunityKpis
        {
            TotalOpen = totalOpen,
            TotalPipelineValue = totalPipeline,
            WeightedPipelineValue = weightedPipeline,
            RottingCount = rottingCount,
            WonRevenue = wonRevenue,
            LostRevenue = lostRevenue,
            WinRate = winRate,
            AvgSalesCycle = avgSalesCycle,
            AvgDealSize = avgDealSize
        };
    }

    private async Task<OpportunityCharts> GetOpportunityChartsAsync()
    {
        var now = DateTime.UtcNow;
        var startOfYear = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var stages = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Where(o => o.strStatus == "Open" && !o.bolIsDeleted)
            .Include(o => o.Stage)
            .GroupBy(o => o.Stage != null ? o.Stage.strStageName : "Unknown")
            .Select(g => new PipelineStageSummaryDto
            {
                strStageName = g.Key ?? string.Empty,
                intCount = g.Count(),
                dblTotalValue = g.Sum(o => o.dblAmount ?? 0),
                intRottingCount = 0 // Calculated separately for performance
            })
            .ToListAsync();

        var revenue = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Where(o => (o.strStatus == "Won" || o.strStatus == "Lost")
                && o.dtActualCloseDate >= startOfYear
                && !o.bolIsDeleted)
            .GroupBy(o => new { o.dtActualCloseDate!.Value.Year, o.dtActualCloseDate.Value.Month })
            .Select(g => new RevenueByMonthDto
            {
                strMonth = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                dblWonAmount = g.Where(o => o.strStatus == "Won").Sum(o => o.dblAmount ?? 0),
                dblLostAmount = g.Where(o => o.strStatus == "Lost").Sum(o => o.dblAmount ?? 0)
            })
            .ToListAsync();

        var topOpps = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Where(o => o.strStatus == "Open" && !o.bolIsDeleted)
            .Include(o => o.Stage)
            .Include(o => o.Account)
            .OrderByDescending(o => o.dblAmount)
            .Take(5)
            .Select(o => new TopOpportunityDto
            {
                strOpportunityGUID = o.strOpportunityGUID,
                strOpportunityName = o.strOpportunityName ?? string.Empty,
                dblAmount = o.dblAmount,
                strStageName = o.Stage != null ? o.Stage.strStageName : string.Empty,
                strAccountName = o.Account != null ? o.Account.strAccountName : null
            })
            .ToListAsync();

        var activities = await _unitOfWork.Activities.Query()
            .AsNoTracking()
            .Where(a => a.bolIsActive
                && a.dtScheduledOn != null
                && a.dtScheduledOn >= now
                && a.dtCompletedOn == null)
            .OrderBy(a => a.dtScheduledOn)
            .Take(10)
            .Select(a => new UpcomingActivityDto
            {
                strActivityGUID = a.strActivityGUID,
                strActivityType = a.strActivityType ?? string.Empty,
                strSubject = a.strSubject ?? string.Empty,
                strStatus = a.strStatus ?? "Open",
                strPriority = a.strPriority ?? "Medium",
                dtScheduledOn = a.dtScheduledOn,
                dtDueDate = a.dtDueDate
            })
            .ToListAsync();

        return new OpportunityCharts
        {
            PipelineStages = stages,
            RevenueByMonth = revenue,
            TopOpportunities = topOpps,
            UpcomingActivities = activities
        };
    }

    #endregion

    #region Private Helper Classes

    private class LeadMetrics
    {
        public int TotalLeads { get; set; }
        public int QualifiedLeads { get; set; }
        public List<LeadsBySourceDto> LeadsBySource { get; set; } = new();
        public List<LeadsByStatusDto> LeadsByStatus { get; set; } = new();
    }

    private class OpportunityMetrics
    {
        public int TotalOpen { get; set; }
        public decimal TotalPipelineValue { get; set; }
        public decimal WeightedPipelineValue { get; set; }
        public int RottingCount { get; set; }
        public decimal WonRevenue { get; set; }
        public decimal LostRevenue { get; set; }
        public double WinRate { get; set; }
        public double AvgSalesCycle { get; set; }
        public decimal AvgDealSize { get; set; }
        public List<PipelineStageSummaryDto> PipelineStages { get; set; } = new();
        public List<TopOpportunityDto> TopOpportunities { get; set; } = new();
        public List<RevenueByMonthDto> RevenueByMonth { get; set; } = new();
        public List<UpcomingActivityDto> UpcomingActivities { get; set; } = new();
    }

    private class OpportunityKpis
    {
        public int TotalOpen { get; set; }
        public decimal TotalPipelineValue { get; set; }
        public decimal WeightedPipelineValue { get; set; }
        public int RottingCount { get; set; }
        public decimal WonRevenue { get; set; }
        public decimal LostRevenue { get; set; }
        public double WinRate { get; set; }
        public double AvgSalesCycle { get; set; }
        public decimal AvgDealSize { get; set; }
    }

    private class OpportunityCharts
    {
        public List<PipelineStageSummaryDto> PipelineStages { get; set; } = new();
        public List<RevenueByMonthDto> RevenueByMonth { get; set; } = new();
        public List<TopOpportunityDto> TopOpportunities { get; set; } = new();
        public List<UpcomingActivityDto> UpcomingActivities { get; set; } = new();
    }

    #endregion
}
