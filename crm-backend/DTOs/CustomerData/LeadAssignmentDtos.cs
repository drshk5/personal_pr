using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

public class CreateAssignmentRuleDto
{
    public string strRuleName { get; set; } = string.Empty;
    public string strAssignmentType { get; set; } = string.Empty;
    public string? strConditionJson { get; set; }
    public int intPriority { get; set; }
}

public class UpdateAssignmentRuleDto : CreateAssignmentRuleDto
{
    public bool bolIsActive { get; set; } = true;
}

public class AssignmentRuleListDto
{
    public Guid strAssignmentRuleGUID { get; set; }
    public string strRuleName { get; set; } = string.Empty;
    public string strAssignmentType { get; set; } = string.Empty;
    public string? strConditionJson { get; set; }
    public int intPriority { get; set; }
    public bool bolIsActive { get; set; }
    public int intMemberCount { get; set; }
    public DateTime dtCreatedOn { get; set; }
}

public class AssignmentMemberDto
{
    public Guid strAssignmentMemberGUID { get; set; }
    public Guid strUserGUID { get; set; }
    public int? intMaxCapacity { get; set; }
    public string? strSkillLevel { get; set; }
    public bool bolIsActive { get; set; }
}

public class AddAssignmentMemberDto
{
    public Guid strUserGUID { get; set; }
    public int? intMaxCapacity { get; set; }
    public string? strSkillLevel { get; set; }
}

public class ManualAssignDto
{
    public Guid strLeadGUID { get; set; }
    public Guid strAssignToGUID { get; set; }
}

public class LeadAssignmentResultDto
{
    public Guid strLeadGUID { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public string strAssignmentMethod { get; set; } = string.Empty;
    public string? strRuleName { get; set; }
}

public class AssignmentRuleFilterParams : PagedRequestDto
{
    public string? strAssignmentType { get; set; }
    public new bool? bolIsActive { get; set; }
}
