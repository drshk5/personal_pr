using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstLeadScoringRule : ITenantEntity
{
    public Guid strScoringRuleGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strRuleName { get; set; } = string.Empty;
    public string strRuleCategory { get; set; } = string.Empty; // Profile, Behavioral, Decay, Negative
    public string strConditionField { get; set; } = string.Empty; // e.g. HasEmail, WebsiteVisit, Unsubscribed
    public string strConditionOperator { get; set; } = "Equals"; // Equals, Contains, GreaterThan, Exists
    public string? strConditionValue { get; set; }
    public int intScorePoints { get; set; } // Can be negative
    public int? intDecayDays { get; set; } // For decay rules
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public int intSortOrder { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
}
