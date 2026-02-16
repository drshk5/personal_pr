using crm_backend.Constants;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace crm_backend.Services.CustomerData;

public class MstLeadAnalyticsService : ILeadAnalyticsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<MstLeadAnalyticsService> _logger;

    public MstLeadAnalyticsService(IUnitOfWork unitOfWork, ILogger<MstLeadAnalyticsService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<LeadDashboardDto> GetDashboardAsync(Guid tenantId)
    {
        _logger.LogInformation("Generating lead dashboard for tenant {TenantId}", tenantId);

        var leads = _unitOfWork.Leads.Query().AsNoTracking();
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalLeads = await leads.CountAsync();
        var newThisMonth = await leads.CountAsync(l => l.dtCreatedOn >= startOfMonth);
        var convertedThisMonth = await leads.CountAsync(l =>
            l.strStatus == LeadStatusConstants.Converted && l.dtConvertedOn != null && l.dtConvertedOn >= startOfMonth);
        var averageScore = totalLeads > 0
            ? await leads.AverageAsync(l => (double)l.intLeadScore)
            : 0;
        var unassigned = await leads.CountAsync(l => l.strAssignedToGUID == null);
        var activeLeads = await leads.CountAsync(l =>
            l.bolIsActive && l.strStatus != LeadStatusConstants.Converted && l.strStatus != LeadStatusConstants.Unqualified);

        var totalConverted = await leads.CountAsync(l => l.strStatus == LeadStatusConstants.Converted);
        var conversionRate = totalLeads > 0 ? Math.Round((double)totalConverted / totalLeads * 100, 2) : 0;

        // Status breakdown
        var statusGroups = await leads
            .GroupBy(l => l.strStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var statusBreakdown = statusGroups.Select(s => new StatusCountDto
        {
            strStatus = s.Status,
            intCount = s.Count,
            dblPercentage = totalLeads > 0 ? Math.Round((double)s.Count / totalLeads * 100, 2) : 0
        }).ToList();

        // Source breakdown with conversion rate per source
        var sourceGroups = await leads
            .GroupBy(l => l.strSource)
            .Select(g => new
            {
                Source = g.Key,
                Count = g.Count(),
                Converted = g.Count(l => l.strStatus == LeadStatusConstants.Converted)
            })
            .ToListAsync();

        var sourceBreakdown = sourceGroups.Select(s => new SourceCountDto
        {
            strSource = s.Source,
            intCount = s.Count,
            intConverted = s.Converted,
            dblConversionRate = s.Count > 0 ? Math.Round((double)s.Converted / s.Count * 100, 2) : 0
        }).ToList();

        // Monthly trend for last 12 months
        var twelveMonthsAgo = now.AddMonths(-12);
        var monthlyData = await leads
            .Where(l => l.dtCreatedOn >= twelveMonthsAgo)
            .GroupBy(l => new { l.dtCreatedOn.Year, l.dtCreatedOn.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                NewLeads = g.Count(),
                Converted = g.Count(l => l.strStatus == LeadStatusConstants.Converted)
            })
            .OrderBy(g => g.Year)
            .ThenBy(g => g.Month)
            .ToListAsync();

        var monthlyTrend = monthlyData.Select(m => new MonthlyTrendDto
        {
            intYear = m.Year,
            intMonth = m.Month,
            strMonth = new DateTime(m.Year, m.Month, 1).ToString("MMM yyyy"),
            intNewLeads = m.NewLeads,
            intConverted = m.Converted
        }).ToList();

        return new LeadDashboardDto
        {
            intTotalLeads = totalLeads,
            intNewLeadsThisMonth = newThisMonth,
            intConvertedThisMonth = convertedThisMonth,
            dblConversionRate = conversionRate,
            dblAverageScore = Math.Round(averageScore, 2),
            intUnassignedLeads = unassigned,
            intActiveLeads = activeLeads,
            StatusBreakdown = statusBreakdown,
            SourceBreakdown = sourceBreakdown,
            MonthlyTrend = monthlyTrend
        };
    }

    public async Task<List<ConversionRateBySourceDto>> GetConversionBySourceAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange)
    {
        _logger.LogInformation("Generating conversion-by-source analytics for tenant {TenantId}", tenantId);

        var leads = ApplyDateRange(_unitOfWork.Leads.Query().AsNoTracking(), dateRange);

        var sourceGroups = await leads
            .GroupBy(l => l.strSource)
            .Select(g => new
            {
                Source = g.Key,
                Total = g.Count(),
                Converted = g.Count(l => l.strStatus == LeadStatusConstants.Converted),
                ConvertedLeads = g
                    .Where(l => l.strStatus == LeadStatusConstants.Converted && l.dtConvertedOn != null)
                    .Select(l => EF.Functions.DateDiffDay(l.dtCreatedOn, l.dtConvertedOn!.Value))
            })
            .ToListAsync();

        return sourceGroups.Select(s =>
        {
            var conversionDays = s.ConvertedLeads.ToList();
            return new ConversionRateBySourceDto
            {
                strSource = s.Source,
                intTotal = s.Total,
                intConverted = s.Converted,
                dblConversionRate = s.Total > 0 ? Math.Round((double)s.Converted / s.Total * 100, 2) : 0,
                dblAverageTimeToConvertDays = conversionDays.Count > 0
                    ? Math.Round(conversionDays.Average(), 2)
                    : 0
            };
        }).OrderByDescending(s => s.dblConversionRate).ToList();
    }

    public async Task<List<ConversionRateByRepDto>> GetConversionByRepAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange)
    {
        _logger.LogInformation("Generating conversion-by-rep analytics for tenant {TenantId}", tenantId);

        var leads = ApplyDateRange(_unitOfWork.Leads.Query().AsNoTracking(), dateRange);

        var repGroups = await leads
            .Where(l => l.strAssignedToGUID != null)
            .GroupBy(l => l.strAssignedToGUID!.Value)
            .Select(g => new ConversionRateByRepDto
            {
                strAssignedToGUID = g.Key,
                intTotal = g.Count(),
                intConverted = g.Count(l => l.strStatus == LeadStatusConstants.Converted),
                dblConversionRate = g.Count() > 0
                    ? Math.Round((double)g.Count(l => l.strStatus == LeadStatusConstants.Converted) / g.Count() * 100, 2)
                    : 0,
                dblAverageScore = Math.Round(g.Average(l => (double)l.intLeadScore), 2)
            })
            .OrderByDescending(r => r.dblConversionRate)
            .ToListAsync();

        return repGroups;
    }

    public async Task<LeadVelocityDto> GetVelocityAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange)
    {
        _logger.LogInformation("Generating lead velocity analytics for tenant {TenantId}", tenantId);

        var leads = _unitOfWork.Leads.Query().AsNoTracking();
        var now = DateTime.UtcNow;

        // Generate last 12 weekly periods
        var periods = new List<VelocityPeriodDto>();
        for (int i = 11; i >= 0; i--)
        {
            var weekStart = now.AddDays(-7 * (i + 1)).Date;
            var weekEnd = now.AddDays(-7 * i).Date;

            var weekStartUtc = DateTime.SpecifyKind(weekStart, DateTimeKind.Utc);
            var weekEndUtc = DateTime.SpecifyKind(weekEnd, DateTimeKind.Utc);

            var newLeads = await leads.CountAsync(l => l.dtCreatedOn >= weekStartUtc && l.dtCreatedOn < weekEndUtc);
            var converted = await leads.CountAsync(l =>
                l.strStatus == LeadStatusConstants.Converted &&
                l.dtConvertedOn != null &&
                l.dtConvertedOn >= weekStartUtc &&
                l.dtConvertedOn < weekEndUtc);

            periods.Add(new VelocityPeriodDto
            {
                strPeriod = $"{weekStart:yyyy-MM-dd} to {weekEnd.AddDays(-1):yyyy-MM-dd}",
                intNewLeads = newLeads,
                intConverted = converted,
                dblGrowthRate = 0 // calculated below
            });
        }

        // Calculate period-over-period growth rate
        for (int i = 1; i < periods.Count; i++)
        {
            var previous = periods[i - 1].intNewLeads;
            var current = periods[i].intNewLeads;
            periods[i].dblGrowthRate = previous > 0
                ? Math.Round((double)(current - previous) / previous * 100, 2)
                : (current > 0 ? 100 : 0);
        }

        // Overall growth rate: first period vs last period
        var firstPeriodLeads = periods.FirstOrDefault()?.intNewLeads ?? 0;
        var lastPeriodLeads = periods.LastOrDefault()?.intNewLeads ?? 0;
        var overallGrowth = firstPeriodLeads > 0
            ? Math.Round((double)(lastPeriodLeads - firstPeriodLeads) / firstPeriodLeads * 100, 2)
            : (lastPeriodLeads > 0 ? 100 : 0);

        return new LeadVelocityDto
        {
            Periods = periods,
            dblOverallGrowthRate = overallGrowth
        };
    }

    public async Task<TimeToConversionDto> GetTimeToConversionAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange)
    {
        _logger.LogInformation("Generating time-to-conversion analytics for tenant {TenantId}", tenantId);

        var leads = ApplyDateRange(_unitOfWork.Leads.Query().AsNoTracking(), dateRange);

        var convertedLeads = await leads
            .Where(l => l.strStatus == LeadStatusConstants.Converted && l.dtConvertedOn != null)
            .Select(l => new
            {
                l.dtCreatedOn,
                ConvertedOn = l.dtConvertedOn!.Value
            })
            .ToListAsync();

        if (!convertedLeads.Any())
        {
            return new TimeToConversionDto
            {
                dblAverageDays = 0,
                dblMedianDays = 0,
                intFastestDays = 0,
                intSlowestDays = 0,
                Buckets = GetEmptyConversionBuckets()
            };
        }

        var daysList = convertedLeads
            .Select(l => (l.ConvertedOn - l.dtCreatedOn).TotalDays)
            .OrderBy(d => d)
            .ToList();

        var average = Math.Round(daysList.Average(), 2);
        var median = Math.Round(GetMedian(daysList), 2);
        var fastest = (int)Math.Floor(daysList.Min());
        var slowest = (int)Math.Ceiling(daysList.Max());

        // Bucket into ranges
        var bucketRanges = new (string Label, int Min, int Max)[]
        {
            ("0-7 days", 0, 7),
            ("8-14 days", 8, 14),
            ("15-30 days", 15, 30),
            ("31-60 days", 31, 60),
            ("61-90 days", 61, 90),
            ("90+ days", 91, int.MaxValue)
        };

        var totalConverted = daysList.Count;
        var buckets = bucketRanges.Select(b =>
        {
            var count = daysList.Count(d => d >= b.Min && (b.Max == int.MaxValue ? true : d <= b.Max));
            return new ConversionBucketDto
            {
                strRange = b.Label,
                intCount = count,
                dblPercentage = totalConverted > 0 ? Math.Round((double)count / totalConverted * 100, 2) : 0
            };
        }).ToList();

        return new TimeToConversionDto
        {
            dblAverageDays = average,
            dblMedianDays = median,
            intFastestDays = fastest,
            intSlowestDays = slowest,
            Buckets = buckets
        };
    }

    public async Task<FunnelDto> GetFunnelAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange)
    {
        _logger.LogInformation("Generating lead funnel analytics for tenant {TenantId}", tenantId);

        var leads = ApplyDateRange(_unitOfWork.Leads.Query().AsNoTracking(), dateRange);

        // Define funnel order: New -> Contacted -> Qualified -> Converted
        var funnelStatuses = new[]
        {
            LeadStatusConstants.New,
            LeadStatusConstants.Contacted,
            LeadStatusConstants.Qualified,
            LeadStatusConstants.Converted
        };

        // Count leads that have reached each stage or beyond
        // A lead at "Qualified" has also passed through "New" and "Contacted"
        var statusCounts = await leads
            .GroupBy(l => l.strStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var statusCountDict = statusCounts.ToDictionary(s => s.Status, s => s.Count);

        // For funnel analysis, count leads that reached each stage (cumulative from bottom)
        // Leads in later stages have passed through earlier stages
        var funnelStageIndexes = funnelStatuses
            .Select((status, index) => new { status, index })
            .ToDictionary(x => x.status, x => x.index);

        // Assign each lead's status an index; include Unqualified as branching from Contacted
        var stages = new List<FunnelStageDto>();
        var cumulativeCounts = new int[funnelStatuses.Length];

        // Each status count in the funnel represents leads currently at that status
        // plus all leads that have moved past it
        for (int i = funnelStatuses.Length - 1; i >= 0; i--)
        {
            var currentStatusCount = statusCountDict.GetValueOrDefault(funnelStatuses[i], 0);
            // Cumulative: this stage count + all later stages
            cumulativeCounts[i] = currentStatusCount + (i < funnelStatuses.Length - 1 ? cumulativeCounts[i + 1] : 0);
        }

        for (int i = 0; i < funnelStatuses.Length; i++)
        {
            var currentCount = cumulativeCounts[i];
            var previousCount = i > 0 ? cumulativeCounts[i - 1] : currentCount;
            var dropOffRate = previousCount > 0 && i > 0
                ? Math.Round((double)(previousCount - currentCount) / previousCount * 100, 2)
                : 0;

            stages.Add(new FunnelStageDto
            {
                strStatus = funnelStatuses[i],
                intCount = currentCount,
                dblDropOffRate = dropOffRate
            });
        }

        return new FunnelDto { Stages = stages };
    }

    public async Task<List<RepPerformanceDto>> GetRepPerformanceAsync(Guid tenantId, AnalyticsDateRangeParams? dateRange)
    {
        _logger.LogInformation("Generating rep performance analytics for tenant {TenantId}", tenantId);

        var leads = ApplyDateRange(_unitOfWork.Leads.Query().AsNoTracking(), dateRange);

        // Group leads by assigned rep
        var repLeadGroups = await leads
            .Where(l => l.strAssignedToGUID != null)
            .GroupBy(l => l.strAssignedToGUID!.Value)
            .Select(g => new
            {
                RepId = g.Key,
                TotalLeads = g.Count(),
                ConvertedLeads = g.Count(l => l.strStatus == LeadStatusConstants.Converted),
                // Average response time: average of (first activity date - lead created date) for leads with activities
                LeadGuids = g.Select(l => l.strLeadGUID).ToList()
            })
            .ToListAsync();

        var activities = _unitOfWork.Activities.Query().AsNoTracking();
        var communications = _unitOfWork.LeadCommunications.Query().AsNoTracking();

        var result = new List<RepPerformanceDto>();

        foreach (var rep in repLeadGroups)
        {
            // Count activities assigned to this rep
            var activityCount = await activities
                .CountAsync(a => a.strAssignedToGUID == rep.RepId);

            // Count communications for leads assigned to this rep
            var commCount = await communications
                .CountAsync(c => rep.LeadGuids.Contains(c.strLeadGUID));

            // Calculate average response time: first communication on each lead vs lead creation
            var leadCreationDates = await leads
                .Where(l => l.strAssignedToGUID == rep.RepId)
                .Select(l => new { l.strLeadGUID, l.dtCreatedOn })
                .ToListAsync();

            var responseTimesHours = new List<double>();
            foreach (var lead in leadCreationDates)
            {
                var firstComm = await communications
                    .Where(c => c.strLeadGUID == lead.strLeadGUID)
                    .OrderBy(c => c.dtCreatedOn)
                    .Select(c => (DateTime?)c.dtCreatedOn)
                    .FirstOrDefaultAsync();

                if (firstComm.HasValue)
                {
                    var hours = (firstComm.Value - lead.dtCreatedOn).TotalHours;
                    if (hours >= 0)
                        responseTimesHours.Add(hours);
                }
            }

            var avgResponseHours = responseTimesHours.Count > 0
                ? Math.Round(responseTimesHours.Average(), 2)
                : 0;

            result.Add(new RepPerformanceDto
            {
                strAssignedToGUID = rep.RepId,
                intTotalLeads = rep.TotalLeads,
                intConvertedLeads = rep.ConvertedLeads,
                dblConversionRate = rep.TotalLeads > 0
                    ? Math.Round((double)rep.ConvertedLeads / rep.TotalLeads * 100, 2)
                    : 0,
                dblAverageResponseTimeHours = avgResponseHours,
                intActivitiesLogged = activityCount,
                intCommunicationsLogged = commCount
            });
        }

        return result.OrderByDescending(r => r.dblConversionRate).ToList();
    }

    public async Task<LeadAgingDto> GetAgingAsync(Guid tenantId)
    {
        _logger.LogInformation("Generating lead aging analytics for tenant {TenantId}", tenantId);

        var now = DateTime.UtcNow;

        // Active leads that are not converted or unqualified
        var activeLeads = await _unitOfWork.Leads.Query().AsNoTracking()
            .Where(l => l.bolIsActive
                        && l.strStatus != LeadStatusConstants.Converted
                        && l.strStatus != LeadStatusConstants.Unqualified)
            .Select(l => l.dtCreatedOn)
            .ToListAsync();

        if (!activeLeads.Any())
        {
            return new LeadAgingDto { Buckets = GetEmptyAgingBuckets() };
        }

        var ageDays = activeLeads.Select(created => (now - created).TotalDays).ToList();
        var totalCount = ageDays.Count;

        var bucketRanges = new (string Label, int Min, int Max)[]
        {
            ("0-7 days", 0, 7),
            ("8-14 days", 8, 14),
            ("15-30 days", 15, 30),
            ("31-60 days", 31, 60),
            ("61-90 days", 61, 90),
            ("90+ days", 91, int.MaxValue)
        };

        var buckets = bucketRanges.Select(b =>
        {
            var count = ageDays.Count(d => d >= b.Min && (b.Max == int.MaxValue ? true : d <= b.Max));
            return new AgingBucketDto
            {
                strRange = b.Label,
                intCount = count,
                dblPercentage = totalCount > 0 ? Math.Round((double)count / totalCount * 100, 2) : 0
            };
        }).ToList();

        return new LeadAgingDto { Buckets = buckets };
    }

    public async Task<ScoreDistributionDto> GetScoreDistributionAsync(Guid tenantId)
    {
        _logger.LogInformation("Generating score distribution analytics for tenant {TenantId}", tenantId);

        var scores = await _unitOfWork.Leads.Query().AsNoTracking()
            .Select(l => l.intLeadScore)
            .ToListAsync();

        if (!scores.Any())
        {
            return new ScoreDistributionDto
            {
                Buckets = GetEmptyScoreBuckets(),
                dblAverageScore = 0,
                dblMedianScore = 0
            };
        }

        var totalCount = scores.Count;
        var average = Math.Round(scores.Average(), 2);
        var sortedScores = scores.OrderBy(s => s).ToList();
        var median = GetMedian(sortedScores.Select(s => (double)s).ToList());

        var bucketRanges = new (string Label, int Min, int Max)[]
        {
            ("0-10", 0, 10),
            ("11-20", 11, 20),
            ("21-30", 21, 30),
            ("31-40", 31, 40),
            ("41-50", 41, 50),
            ("51-60", 51, 60),
            ("61-70", 61, 70),
            ("71-80", 71, 80),
            ("81-90", 81, 90),
            ("91-100", 91, 100)
        };

        var buckets = bucketRanges.Select(b =>
        {
            var count = scores.Count(s => s >= b.Min && s <= b.Max);
            return new ScoreBucketDto
            {
                strRange = b.Label,
                intMin = b.Min,
                intMax = b.Max,
                intCount = count,
                dblPercentage = totalCount > 0 ? Math.Round((double)count / totalCount * 100, 2) : 0
            };
        }).ToList();

        return new ScoreDistributionDto
        {
            Buckets = buckets,
            dblAverageScore = average,
            dblMedianScore = Math.Round(median, 2)
        };
    }

    #region Private Helpers

    private static IQueryable<Models.Core.CustomerData.MstLead> ApplyDateRange(
        IQueryable<Models.Core.CustomerData.MstLead> query,
        AnalyticsDateRangeParams? dateRange)
    {
        if (dateRange == null) return query;

        if (dateRange.dtFromDate.HasValue)
        {
            var from = DateTime.SpecifyKind(dateRange.dtFromDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(l => l.dtCreatedOn >= from);
        }

        if (dateRange.dtToDate.HasValue)
        {
            var to = DateTime.SpecifyKind(dateRange.dtToDate.Value.Date.AddDays(1), DateTimeKind.Utc);
            query = query.Where(l => l.dtCreatedOn < to);
        }

        return query;
    }

    private static double GetMedian(List<double> sortedValues)
    {
        if (!sortedValues.Any()) return 0;
        var count = sortedValues.Count;
        if (count % 2 == 0)
            return (sortedValues[count / 2 - 1] + sortedValues[count / 2]) / 2.0;
        return sortedValues[count / 2];
    }

    private static List<ConversionBucketDto> GetEmptyConversionBuckets()
    {
        return new List<ConversionBucketDto>
        {
            new() { strRange = "0-7 days", intCount = 0, dblPercentage = 0 },
            new() { strRange = "8-14 days", intCount = 0, dblPercentage = 0 },
            new() { strRange = "15-30 days", intCount = 0, dblPercentage = 0 },
            new() { strRange = "31-60 days", intCount = 0, dblPercentage = 0 },
            new() { strRange = "61-90 days", intCount = 0, dblPercentage = 0 },
            new() { strRange = "90+ days", intCount = 0, dblPercentage = 0 }
        };
    }

    private static List<AgingBucketDto> GetEmptyAgingBuckets()
    {
        return new List<AgingBucketDto>
        {
            new() { strRange = "0-7 days", intCount = 0, dblPercentage = 0 },
            new() { strRange = "8-14 days", intCount = 0, dblPercentage = 0 },
            new() { strRange = "15-30 days", intCount = 0, dblPercentage = 0 },
            new() { strRange = "31-60 days", intCount = 0, dblPercentage = 0 },
            new() { strRange = "61-90 days", intCount = 0, dblPercentage = 0 },
            new() { strRange = "90+ days", intCount = 0, dblPercentage = 0 }
        };
    }

    private static List<ScoreBucketDto> GetEmptyScoreBuckets()
    {
        return new List<ScoreBucketDto>
        {
            new() { strRange = "0-10", intMin = 0, intMax = 10, intCount = 0, dblPercentage = 0 },
            new() { strRange = "11-20", intMin = 11, intMax = 20, intCount = 0, dblPercentage = 0 },
            new() { strRange = "21-30", intMin = 21, intMax = 30, intCount = 0, dblPercentage = 0 },
            new() { strRange = "31-40", intMin = 31, intMax = 40, intCount = 0, dblPercentage = 0 },
            new() { strRange = "41-50", intMin = 41, intMax = 50, intCount = 0, dblPercentage = 0 },
            new() { strRange = "51-60", intMin = 51, intMax = 60, intCount = 0, dblPercentage = 0 },
            new() { strRange = "61-70", intMin = 61, intMax = 70, intCount = 0, dblPercentage = 0 },
            new() { strRange = "71-80", intMin = 71, intMax = 80, intCount = 0, dblPercentage = 0 },
            new() { strRange = "81-90", intMin = 81, intMax = 90, intCount = 0, dblPercentage = 0 },
            new() { strRange = "91-100", intMin = 91, intMax = 100, intCount = 0, dblPercentage = 0 }
        };
    }

    #endregion
}
