using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstLeadAssignmentMember : ITenantEntity
{
    public Guid strAssignmentMemberGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public Guid strAssignmentRuleGUID { get; set; }
    public Guid strUserGUID { get; set; }
    public int? intMaxCapacity { get; set; } // Max active leads (null = unlimited)
    public string? strSkillLevel { get; set; } // Junior, Senior, Manager
    public bool bolIsActive { get; set; } = true;
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;

    // Navigation
    public MstLeadAssignmentRule? AssignmentRule { get; set; }
}
