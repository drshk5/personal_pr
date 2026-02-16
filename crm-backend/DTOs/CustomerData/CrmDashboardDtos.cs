namespace crm_backend.DTOs.CustomerData;

public class CrmDashboardDto
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

    public List<PipelineStageSummaryDto> PipelineStages { get; set; } = new();
    public List<LeadsBySourceDto> LeadsBySource { get; set; } = new();
    public List<LeadsByStatusDto> LeadsByStatus { get; set; } = new();
    public List<RevenueByMonthDto> RevenueByMonth { get; set; } = new();
    public List<TopOpportunityDto> TopOpportunities { get; set; } = new();
    public List<UpcomingActivityDto> UpcomingActivities { get; set; } = new();
}

public class PipelineStageSummaryDto
{
    public string strStageName { get; set; } = string.Empty;
    public int intCount { get; set; }
    public decimal dblTotalValue { get; set; }
    public int intRottingCount { get; set; }
}

public class LeadsBySourceDto
{
    public string strSource { get; set; } = string.Empty;
    public int intCount { get; set; }
}

public class LeadsByStatusDto
{
    public string strStatus { get; set; } = string.Empty;
    public int intCount { get; set; }
}

public class RevenueByMonthDto
{
    public string strMonth { get; set; } = string.Empty;
    public decimal dblWonAmount { get; set; }
    public decimal dblLostAmount { get; set; }
}

public class TopOpportunityDto
{
    public Guid strOpportunityGUID { get; set; }
    public string strOpportunityName { get; set; } = string.Empty;
    public decimal? dblAmount { get; set; }
    public string strStageName { get; set; } = string.Empty;
    public string? strAccountName { get; set; }
}

public class UpcomingActivityDto
{
    public Guid strActivityGUID { get; set; }
    public string strActivityType { get; set; } = string.Empty;
    public string strSubject { get; set; } = string.Empty;
    public DateTime? dtScheduledOn { get; set; }
    public string? strEntityName { get; set; }
}
