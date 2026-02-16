using crm_backend.Constants;

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
    public string strStatus { get; set; } = ActivityStatusConstants.Pending;
    public string strPriority { get; set; } = ActivityPriorityConstants.Medium;
    public DateTime? dtDueDate { get; set; }
    public string? strCategory { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public DateTime? dtDeletedOn { get; set; }

    // Navigation
    public ICollection<MstActivityLink> ActivityLinks { get; set; } = new List<MstActivityLink>();
}
