namespace crm_backend.DTOs.CustomerData;

public class AnalyticsDateRangeParams
{
    public DateTime? dtFromDate { get; set; }
    public DateTime? dtToDate { get; set; }
}

public class LeadDashboardDto
{
    public int intTotalLeads { get; set; }
    public int intNewLeadsThisMonth { get; set; }
    public int intConvertedThisMonth { get; set; }
    public double dblConversionRate { get; set; }
    public double dblAverageScore { get; set; }
    public int intUnassignedLeads { get; set; }
    public int intActiveLeads { get; set; }
    public List<StatusCountDto> StatusBreakdown { get; set; } = new();
    public List<SourceCountDto> SourceBreakdown { get; set; } = new();
    public List<MonthlyTrendDto> MonthlyTrend { get; set; } = new();
}

public class StatusCountDto
{
    public string strStatus { get; set; } = string.Empty;
    public int intCount { get; set; }
    public double dblPercentage { get; set; }
}

public class SourceCountDto
{
    public string strSource { get; set; } = string.Empty;
    public int intCount { get; set; }
    public int intConverted { get; set; }
    public double dblConversionRate { get; set; }
}

public class MonthlyTrendDto
{
    public int intYear { get; set; }
    public int intMonth { get; set; }
    public string strMonth { get; set; } = string.Empty;
    public int intNewLeads { get; set; }
    public int intConverted { get; set; }
}

public class ConversionRateBySourceDto
{
    public string strSource { get; set; } = string.Empty;
    public int intTotal { get; set; }
    public int intConverted { get; set; }
    public double dblConversionRate { get; set; }
    public double dblAverageTimeToConvertDays { get; set; }
}

public class ConversionRateByRepDto
{
    public Guid strAssignedToGUID { get; set; }
    public int intTotal { get; set; }
    public int intConverted { get; set; }
    public double dblConversionRate { get; set; }
    public double dblAverageScore { get; set; }
}

public class LeadVelocityDto
{
    public List<VelocityPeriodDto> Periods { get; set; } = new();
    public double dblOverallGrowthRate { get; set; }
}

public class VelocityPeriodDto
{
    public string strPeriod { get; set; } = string.Empty;
    public int intNewLeads { get; set; }
    public int intConverted { get; set; }
    public double dblGrowthRate { get; set; }
}

public class TimeToConversionDto
{
    public double dblAverageDays { get; set; }
    public double dblMedianDays { get; set; }
    public int intFastestDays { get; set; }
    public int intSlowestDays { get; set; }
    public List<ConversionBucketDto> Buckets { get; set; } = new();
}

public class ConversionBucketDto
{
    public string strRange { get; set; } = string.Empty;
    public int intCount { get; set; }
    public double dblPercentage { get; set; }
}

public class FunnelDto
{
    public List<FunnelStageDto> Stages { get; set; } = new();
}

public class FunnelStageDto
{
    public string strStatus { get; set; } = string.Empty;
    public int intCount { get; set; }
    public double dblDropOffRate { get; set; }
}

public class RepPerformanceDto
{
    public Guid strAssignedToGUID { get; set; }
    public int intTotalLeads { get; set; }
    public int intConvertedLeads { get; set; }
    public double dblConversionRate { get; set; }
    public double dblAverageResponseTimeHours { get; set; }
    public int intActivitiesLogged { get; set; }
    public int intCommunicationsLogged { get; set; }
}

public class LeadAgingDto
{
    public List<AgingBucketDto> Buckets { get; set; } = new();
}

public class AgingBucketDto
{
    public string strRange { get; set; } = string.Empty;
    public int intCount { get; set; }
    public double dblPercentage { get; set; }
}

public class ScoreDistributionDto
{
    public List<ScoreBucketDto> Buckets { get; set; } = new();
    public double dblAverageScore { get; set; }
    public double dblMedianScore { get; set; }
}

public class ScoreBucketDto
{
    public string strRange { get; set; } = string.Empty;
    public int intMin { get; set; }
    public int intMax { get; set; }
    public int intCount { get; set; }
    public double dblPercentage { get; set; }
}
