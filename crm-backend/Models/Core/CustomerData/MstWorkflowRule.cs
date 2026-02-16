using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstWorkflowRule : ITenantEntity
{
    public Guid strWorkflowRuleGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strRuleName { get; set; } = string.Empty;
    public string strEntityType { get; set; } = string.Empty; // Lead
    public string strTriggerEvent { get; set; } = string.Empty; // StatusChanged, Created, ScoreChanged, Aging
    public string? strTriggerConditionJson { get; set; } // JSON: {"fromStatus":"New","toStatus":"Contacted"}
    public string strActionType { get; set; } = string.Empty; // CreateTask, SendNotification, ChangeStatus, Archive
    public string? strActionConfigJson { get; set; } // JSON: {"taskSubject":"Follow up","delayHours":24}
    public int intDelayMinutes { get; set; } // Delay before action
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime? dtUpdatedOn { get; set; }

    // Navigation
    public ICollection<MstWorkflowExecution> Executions { get; set; } = new List<MstWorkflowExecution>();
}
