using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

public class CreateWorkflowRuleDto
{
    public string strRuleName { get; set; } = string.Empty;
    public string strEntityType { get; set; } = string.Empty;
    public string strTriggerEvent { get; set; } = string.Empty;
    public string? strTriggerConditionJson { get; set; }
    public string strActionType { get; set; } = string.Empty;
    public string? strActionConfigJson { get; set; }
    public int intDelayMinutes { get; set; } = 0;
}

public class UpdateWorkflowRuleDto : CreateWorkflowRuleDto
{
    public bool bolIsActive { get; set; } = true;
}

public class WorkflowRuleListDto
{
    public Guid strWorkflowRuleGUID { get; set; }
    public string strRuleName { get; set; } = string.Empty;
    public string strEntityType { get; set; } = string.Empty;
    public string strTriggerEvent { get; set; } = string.Empty;
    public string? strTriggerConditionJson { get; set; }
    public string strActionType { get; set; } = string.Empty;
    public string? strActionConfigJson { get; set; }
    public int intDelayMinutes { get; set; }
    public bool bolIsActive { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public int intExecutionCount { get; set; }
}

public class WorkflowExecutionListDto
{
    public Guid strExecutionGUID { get; set; }
    public Guid strWorkflowRuleGUID { get; set; }
    public Guid strEntityGUID { get; set; }
    public string strStatus { get; set; } = string.Empty;
    public string? strResultJson { get; set; }
    public DateTime dtScheduledFor { get; set; }
    public DateTime? dtExecutedOn { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public string? strRuleName { get; set; }
}

public class WorkflowRuleFilterParams : PagedRequestDto
{
    public string? strEntityType { get; set; }
    public string? strTriggerEvent { get; set; }
    public new bool? bolIsActive { get; set; }
}
