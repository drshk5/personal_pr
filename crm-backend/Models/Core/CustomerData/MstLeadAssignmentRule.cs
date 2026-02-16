using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstLeadAssignmentRule : ITenantEntity
{
    public Guid strAssignmentRuleGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strRuleName { get; set; } = string.Empty;
    public string strAssignmentType { get; set; } = string.Empty; // RoundRobin, Territory, Capacity, SkillBased
    public string? strConditionJson { get; set; } // JSON: territory filters, skill criteria
    public int intPriority { get; set; } // Lower = higher priority
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public int intLastAssignedIndex { get; set; } // For round-robin tracking
    public Guid strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime? dtUpdatedOn { get; set; }

    // Navigation
    public ICollection<MstLeadAssignmentMember> Members { get; set; } = new List<MstLeadAssignmentMember>();
}
