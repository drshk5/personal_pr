namespace crm_backend.Models.Core.CustomerData;

public class MstActivity : ITenantEntity
{
    public Guid strActivityGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strActivityType { get; set; } = string.Empty;
    public string strSubject { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public DateTime? dtScheduledOn { get; set; }
    public DateTime? dtCompletedOn { get; set; }
    public int? intDurationMinutes { get; set; }
    public string? strOutcome { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;

    // Navigation
    public ICollection<MstActivityLink> ActivityLinks { get; set; } = new List<MstActivityLink>();
}
