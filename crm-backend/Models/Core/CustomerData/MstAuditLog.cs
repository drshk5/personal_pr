namespace crm_backend.Models.Core.CustomerData;

public class MstAuditLog : ITenantEntity
{
    public Guid strAuditLogGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strEntityType { get; set; } = string.Empty;
    public Guid strEntityGUID { get; set; }
    public string strAction { get; set; } = string.Empty;
    public string? strChanges { get; set; }
    public Guid strPerformedByGUID { get; set; }
    public DateTime dtPerformedOn { get; set; }
}
