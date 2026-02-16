using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstWorkflowExecution : ITenantEntity
{
    public Guid strExecutionGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public Guid strWorkflowRuleGUID { get; set; }
    public Guid strEntityGUID { get; set; } // Lead GUID that triggered this
    public string strStatus { get; set; } = "Pending"; // Pending, Executed, Failed, Skipped
    public string? strResultJson { get; set; }
    public DateTime dtScheduledFor { get; set; }
    public DateTime? dtExecutedOn { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;

    // Navigation
    public MstWorkflowRule? WorkflowRule { get; set; }
}
