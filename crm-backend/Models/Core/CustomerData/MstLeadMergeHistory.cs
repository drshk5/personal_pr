using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstLeadMergeHistory : ITenantEntity
{
    public Guid strMergeHistoryGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public Guid strSurvivorLeadGUID { get; set; }
    public Guid strMergedLeadGUID { get; set; }
    public string? strMergedDataJson { get; set; } // JSON snapshot of merged lead
    public Guid strMergedByGUID { get; set; }
    public DateTime dtMergedOn { get; set; } = DateTime.UtcNow;

    // Navigation
    public MstLead? SurvivorLead { get; set; }
}
