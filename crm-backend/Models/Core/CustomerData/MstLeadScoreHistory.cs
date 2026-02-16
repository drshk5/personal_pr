using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstLeadScoreHistory : ITenantEntity
{
    public Guid strScoreHistoryGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public Guid strLeadGUID { get; set; }
    public int intPreviousScore { get; set; }
    public int intNewScore { get; set; }
    public int intScoreChange { get; set; }
    public string strChangeReason { get; set; } = string.Empty;
    public Guid? strScoringRuleGUID { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;

    // Navigation
    public MstLead? Lead { get; set; }
    public MstLeadScoringRule? ScoringRule { get; set; }
}
